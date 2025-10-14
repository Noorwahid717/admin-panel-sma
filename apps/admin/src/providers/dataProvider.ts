import axios, { AxiosHeaders, type AxiosResponse } from "axios";
import type {
  BaseRecord,
  CrudFilters,
  DataProvider,
  GetListResponse,
  GetOneResponse,
  CreateResponse,
  UpdateResponse,
  DeleteOneResponse,
  GetManyResponse,
} from "@refinedev/core";
import { studentQuerySchema } from "@shared/schemas";

const sanitizeBaseUrl = (rawUrl?: string) => {
  if (rawUrl && rawUrl.trim().length > 0) {
    return rawUrl.replace(/\/+$/, "");
  }

  try {
    if (typeof window !== "undefined" && window?.location?.origin) {
      return `${window.location.origin.replace(/\/+$/, "")}/api/v1`;
    }
  } catch {
    // ignore
  }

  return "http://localhost:3000/api/v1";
};

const envBaseUrl = sanitizeBaseUrl(import.meta.env.VITE_API_URL);

const API_BASE_URL = (() => {
  if (typeof window === "undefined") {
    return envBaseUrl;
  }

  try {
    const origin = window.location.origin.replace(/\/+$/, "");
    const isSameOrigin = envBaseUrl.startsWith(origin);
    if (import.meta.env.DEV && !isSameOrigin) {
      const fallback = `${origin}/api`;
      console.warn(
        "[dataProvider] Overriding API base for MSW development:",
        envBaseUrl,
        "→",
        fallback
      );
      return fallback;
    }
  } catch {
    // ignore
  }

  return envBaseUrl;
})();

const ensureLeadingSlash = (path: string) => (path.startsWith("/") ? path : `/${path}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Log resolved base in browser runtime (non-sensitive)
try {
  if (typeof window !== "undefined") {
    console.info("[dataProvider] Resolved API base:", API_BASE_URL);
  }
} catch {}

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== "undefined") {
        const maskedHeaders = {
          ...(config.headers && typeof config.headers === "object" ? config.headers : {}),
        } as Record<string, unknown>;
        if (maskedHeaders.Authorization || maskedHeaders.authorization) {
          maskedHeaders.Authorization = "Bearer ••••";
        }
        console.info(
          "[dataProvider] Request",
          config.method?.toUpperCase?.() ?? config.method,
          config.url,
          { params: config.params, headers: maskedHeaders }
        );
      }
    } catch {}
    const token = localStorage.getItem("access_token");
    if (token) {
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        const headers = AxiosHeaders.from(config.headers ?? {});
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const clearStoredSession = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
    // --- DEV in-memory store -------------------------------------------------
    // Keep the development store close to the dataProvider so CRUD methods can
    // operate on the same fixtures used by getList when the backend is offline.
  }
);

const studentFiltersSchema = studentQuerySchema.partial();

const filterSchemas: Partial<Record<string, typeof studentFiltersSchema>> = {
  students: studentFiltersSchema,
};

const flattenFilters = (filters?: CrudFilters): Record<string, unknown> => {
  if (!filters) {
    return {};
  }

  return filters.reduce<Record<string, unknown>>((acc, filter) => {
    if ("field" in filter && "operator" in filter) {
      const { field, operator, value } = filter;
      if (operator === "eq" || operator === "contains" || operator === "in") {
        acc[field as string] = value;
      }
    }

    return acc;
  }, {});
};

const transformFilters = (resource: string, filters?: CrudFilters): Record<string, unknown> => {
  const flattened = flattenFilters(filters);
  const schema = filterSchemas[resource];

  if (!schema) {
    return flattened;
  }

  const parsed = schema.safeParse(flattened);
  return parsed.success ? parsed.data : flattened;
};

const resolveTotal = (payload: Record<string, unknown>, fallback: number) => {
  const directTotal = payload.total;
  if (typeof directTotal === "number") {
    return directTotal;
  }

  const count = payload.count;
  if (typeof count === "number") {
    return count;
  }

  const meta = payload.meta;
  if (meta && typeof meta === "object" && "total" in meta) {
    const metaTotal = (meta as { total?: number }).total;
    if (typeof metaTotal === "number") {
      return metaTotal;
    }
  }

  return fallback;
};

const extractListPayload = <TData extends BaseRecord = BaseRecord>(
  response: AxiosResponse
): GetListResponse<TData> => {
  const payload = response.data as Record<string, unknown> | unknown[] | undefined;

  if (Array.isArray(payload)) {
    return { data: payload as TData[], total: payload.length };
  }

  if (payload && typeof payload === "object") {
    const candidates =
      (payload.data as unknown) ??
      (payload.items as unknown) ??
      (payload.results as unknown) ??
      (payload.rows as unknown);

    if (Array.isArray(candidates)) {
      return {
        data: candidates as TData[],
        total: resolveTotal(payload as Record<string, unknown>, candidates.length),
      };
    }

    if (candidates && typeof candidates === "object") {
      return {
        data: [candidates as TData],
        total: resolveTotal(payload as Record<string, unknown>, 1),
      };
    }

    return { data: [], total: resolveTotal(payload as Record<string, unknown>, 0) };
  }

  return { data: [], total: 0 };
};

const resolveHeaders = (meta?: Record<string, unknown>) =>
  (meta?.headers as Record<string, string> | undefined) ?? undefined;

const resolveSignal = (meta?: Record<string, unknown>) =>
  (meta?.signal as AbortSignal | undefined) ?? undefined;

const ensureParams = (
  params: Parameters<DataProvider["getList"]>[0]
): {
  resource: string;
  pagination?: { current?: number; pageSize?: number };
  filters?: CrudFilters;
  meta?: Record<string, unknown>;
} => ({
  resource: params.resource,
  pagination: params.pagination,
  filters: params.filters,
  meta: params.meta,
});

const dataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["getList"]>[0]
  ): Promise<GetListResponse<TData>> => {
    const { resource, pagination, filters, meta } = ensureParams(params as any);

    const queryParams: Record<string, unknown> = {
      ...transformFilters(resource, filters as CrudFilters | undefined),
    };

    if (pagination?.pageSize) {
      queryParams.limit = pagination.pageSize;
    }

    if (meta?.cursor) {
      queryParams.cursor = meta.cursor;
    }

    const response = await api.get(ensureLeadingSlash(resource), {
      params: queryParams,
      headers: resolveHeaders(meta),
      signal: resolveSignal(meta),
    });

    return extractListPayload(response);
  },

  getApiUrl: () => api.defaults.baseURL ?? "",

  getOne: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["getOne"]>[0]
  ): Promise<GetOneResponse<TData>> => {
    const { resource, id, meta } = params as any;
    const response = await api.get(ensureLeadingSlash(`${resource}/${id}`), {
      headers: resolveHeaders(meta),
    });
    return { data: response.data as TData };
  },

  create: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["create"]>[0]
  ): Promise<CreateResponse<TData>> => {
    const { resource, variables, meta } = params as any;
    const response = await api.post(ensureLeadingSlash(resource), variables, {
      headers: resolveHeaders(meta),
    });
    return { data: response.data as TData };
  },

  update: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["update"]>[0]
  ): Promise<UpdateResponse<TData>> => {
    const { resource, id, variables, meta } = params as any;
    const response = await api.patch(ensureLeadingSlash(`${resource}/${id}`), variables, {
      headers: resolveHeaders(meta),
    });
    return { data: response.data as TData };
  },

  deleteOne: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["deleteOne"]>[0]
  ): Promise<DeleteOneResponse<TData>> => {
    const { resource, id, meta } = params as any;
    const response = await api.delete(ensureLeadingSlash(`${resource}/${id}`), {
      headers: resolveHeaders(meta),
    });
    return { data: response.data as TData };
  },

  getMany: async <TData extends BaseRecord = BaseRecord>(
    params: Parameters<DataProvider["getMany"]>[0]
  ): Promise<GetManyResponse<TData>> => {
    const { resource, ids, meta } = params as any;
    const response = await api.get(ensureLeadingSlash(resource), {
      params: { ids },
      headers: resolveHeaders(meta),
    });
    return extractListPayload(response) as unknown as GetManyResponse<TData>;
  },

  custom: async () => Promise.reject(new Error("custom requests are not implemented yet")),
};

const formatArg = (arg: unknown) => {
  if (typeof arg === "string" || typeof arg === "number" || typeof arg === "boolean") {
    return arg;
  }

  if (arg instanceof URL) {
    return arg.toString();
  }

  try {
    return JSON.parse(JSON.stringify(arg));
  } catch (error) {
    console.warn("[DataProvider] Unable to serialise argument for logging", arg, error);
    return arg;
  }
};

const formatArgs = (args: unknown[]) => args.map(formatArg);

const createDataProviderLogger = (dp: DataProvider): DataProvider =>
  new Proxy(dp, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);

      if (typeof value !== "function") {
        return value;
      }

      return (...args: unknown[]) => {
        const formattedArgs = formatArgs(args);
        console.info("[DataProvider]", String(prop), formattedArgs);

        try {
          const result = (value as (...innerArgs: unknown[]) => unknown).apply(target, args);

          if (result instanceof Promise) {
            return result.finally(() => {
              console.info("[DataProvider]", String(prop), "completed");
            });
          }

          console.info("[DataProvider]", String(prop), "completed");
          return result;
        } catch (error) {
          console.error("[DataProvider]", String(prop), "failed", error);
          throw error;
        }
      };
    },
  });

const resolveDataProvider = () => {
  if (import.meta.env.DEV) {
    return createDataProviderLogger(dataProvider);
  }

  return dataProvider;
};

export { api, dataProvider, createDataProviderLogger, resolveDataProvider };
