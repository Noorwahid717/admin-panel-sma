import axios, { type AxiosResponse } from "axios";
import type {
  BaseRecord,
  CrudFilters,
  CrudSorting,
  DataProvider,
  GetListResponse,
} from "@refinedev/core";
import { studentQuerySchema } from "@shared/schemas";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear tokens and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
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

const buildSorting = (sorters?: CrudSorting): string | undefined => {
  if (!sorters || sorters.length === 0) {
    return undefined;
  }

  return sorters
    .map((sorter) => `${sorter.field}:${sorter.order === "asc" ? "asc" : "desc"}`)
    .join(",");
};

const extractListPayload = <TData extends BaseRecord = BaseRecord>(
  response: AxiosResponse
): GetListResponse<TData> => {
  const payload = response.data as Record<string, unknown> | unknown[] | undefined;

  if (Array.isArray(payload)) {
    return {
      data: payload as TData[],
      total: payload.length,
    };
  }

  if (payload && typeof payload === "object") {
    const items =
      (payload.items as TData[] | undefined) ??
      (payload.data as TData[] | undefined) ??
      ([] as TData[]);
    const total =
      (payload.total as number | undefined) ??
      (payload.count as number | undefined) ??
      items.length;
    return { data: items, total };
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
  sorters?: CrudSorting;
  meta?: Record<string, unknown>;
} => ({
  resource: params.resource,
  pagination: params.pagination,
  filters: params.filters,
  sorters: params.sorters,
  meta: params.meta,
});

const dataProvider: DataProvider = {
  getList: async (params) => {
    const { resource, pagination, filters, sorters, meta } = ensureParams(params);

    const queryParams: Record<string, unknown> = {
      ...transformFilters(resource, filters as CrudFilters | undefined),
    };

    if (pagination) {
      queryParams.page = pagination.current ?? 1;
      queryParams.limit = pagination.pageSize ?? 10;
    }

    const sort = buildSorting(sorters as CrudSorting | undefined);
    if (sort) {
      queryParams.sort = sort;
    }

    const response = await api.get(`/${resource}`, {
      params: queryParams,
      headers: resolveHeaders(meta),
      signal: resolveSignal(meta),
    });

    return extractListPayload(response);
  },

  getApiUrl: () => api.defaults.baseURL ?? "",

  getOne: async () => Promise.reject(new Error("getOne is not implemented yet")),
  create: async () => Promise.reject(new Error("create is not implemented yet")),
  update: async () => Promise.reject(new Error("update is not implemented yet")),
  deleteOne: async () => Promise.reject(new Error("deleteOne is not implemented yet")),
  getMany: async () => Promise.reject(new Error("getMany is not implemented yet")),
  custom: async () => Promise.reject(new Error("custom requests are not implemented yet")),
};

export { api, dataProvider };
