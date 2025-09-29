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

const rawProvider = {
  getList: async (paramsRaw: Record<string, any>) => {
    const { resource, pagination, filters, sorters, meta } = paramsRaw as {
      resource: string;
      pagination?: { current?: number; pageSize?: number };
      filters?: CrudFilters;
      sorters?: CrudSorting;
      meta?: Record<string, unknown>;
    };

    const params: Record<string, unknown> = {
      ...transformFilters(resource, filters as CrudFilters | undefined),
    };

    if (pagination) {
      params.page = pagination.current ?? 1;
      params.limit = pagination.pageSize ?? 10;
    }

    const sort = buildSorting(sorters as CrudSorting | undefined);
    if (sort) {
      params.sort = sort;
    }

    const response = await api.get(`/${resource}`, {
      params,
      headers: resolveHeaders(meta),
      signal: resolveSignal(meta),
    });

    return extractListPayload<BaseRecord>(response) as unknown as GetListResponse<any>;
  },

  getApiUrl: () => api.defaults.baseURL ?? "",

  getOne: async () => {
    throw new Error("getOne is not implemented yet");
  },
  create: async () => {
    throw new Error("create is not implemented yet");
  },
  update: async () => {
    throw new Error("update is not implemented yet");
  },
  deleteOne: async () => {
    throw new Error("deleteOne is not implemented yet");
  },
  getMany: async () => {
    throw new Error("getMany is not implemented yet");
  },
  getManyReference: async () => {
    throw new Error("getManyReference is not implemented yet");
  },
  createMany: async () => {
    throw new Error("createMany is not implemented yet");
  },
  deleteMany: async () => {
    throw new Error("deleteMany is not implemented yet");
  },
  updateMany: async () => {
    throw new Error("updateMany is not implemented yet");
  },
  custom: async () => {
    throw new Error("custom requests are not implemented yet");
  },
};

export const dataProvider = rawProvider as unknown as DataProvider;

export { api };
