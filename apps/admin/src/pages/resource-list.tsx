import { useCallback, useEffect, useMemo } from "react";
import { Button, Result, Space, Spin, Table, Typography } from "antd";
import type { AxiosError } from "axios";
import type { ColumnsType } from "antd/es/table";
import { List, useTable } from "@refinedev/antd";
import { useResource } from "@refinedev/core";

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    console.warn("[ResourceList] Unable to serialise value for debugging", value, error);
    return undefined;
  }
};

const formatTitle = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());

export const ResourceList = () => {
  const { resource } = useResource();
  const { tableProps, tableQueryResult } = useTable({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  const {
    data,
    error,
    fetchStatus,
    isError = false,
    isFetched = false,
    isFetching = false,
    isInitialLoading = false,
    isLoading = false,
    refetch,
    status,
  } = tableQueryResult ?? {};

  const {
    dataSource: originalDataSource,
    loading: _originalLoading,
    ...restTableProps
  } = tableProps;

  const dataSource = useMemo(() => {
    if (Array.isArray(originalDataSource)) {
      return originalDataSource as Record<string, unknown>[];
    }

    const queryData = data?.data;
    if (Array.isArray(queryData)) {
      return queryData as Record<string, unknown>[];
    }

    return [] as Record<string, unknown>[];
  }, [data?.data, originalDataSource]);

  const hasRecords = dataSource.length > 0;
  const hasFetchedAtLeastOnce = isFetched || status === "success";
  const isCurrentlyLoading =
    isInitialLoading || (!hasFetchedAtLeastOnce && (isLoading || fetchStatus === "fetching"));
  const showLoadingState = isCurrentlyLoading && !hasRecords;
  const showEmptyState = !isError && hasFetchedAtLeastOnce && !hasRecords && !isFetching;

  useEffect(() => {
    if (showEmptyState) {
      console.info(
        `[ResourceList] Data kosong untuk ${resource?.name ?? "resource"}. Periksa filter atau sumber data.`,
        {
          resource: resource?.name,
          status,
        }
      );
    }
  }, [resource?.name, showEmptyState, status]);

  useEffect(() => {
    if (isError) {
      console.error(`[ResourceList] Failed to fetch ${resource?.name ?? "resource"} data`, error);
    }
  }, [error, isError, resource?.name]);

  const handleRetry = useCallback(() => {
    if (refetch) {
      void refetch();
    }
  }, [refetch]);

  const resourceLabel = useMemo(
    () => resource?.meta?.label ?? resource?.label ?? resource?.name ?? "Resource",
    [resource?.label, resource?.meta?.label, resource?.name]
  );

  const resourceLabelLower = resourceLabel.toLocaleLowerCase("id-ID");
  const resourceEndpoint = resource?.name ? `/${resource.name}` : "-";

  const errorResult = useMemo(() => {
    if (!isError) {
      return null;
    }

    const axiosError = error as unknown as AxiosError<{
      message?: string;
      error?: string;
    }>;
    const httpError = (error as { statusCode?: number; status?: number; message?: string }) ?? {};
    const statusCode = axiosError?.response?.status ?? httpError.statusCode ?? httpError.status;
    const responseMessage =
      axiosError?.response?.data?.message ??
      axiosError?.response?.data?.error ??
      axiosError?.message ??
      httpError.message ??
      (typeof axiosError === "object" && axiosError !== null
        ? (axiosError as { message?: string }).message
        : undefined);

    const debugPayload =
      axiosError?.response?.data ??
      (typeof axiosError?.toJSON === "function" ? axiosError.toJSON() : undefined) ??
      (typeof error === "object" ? error : undefined);
    const debugText = safeStringify(debugPayload);

    const retryAction = (
      <Button type="primary" onClick={handleRetry}>
        Coba lagi
      </Button>
    );

    if (statusCode === 401) {
      return (
        <Result
          status="403"
          title="Tidak ada otorisasi"
          subTitle={
            responseMessage ??
            "Token akses tidak valid atau telah kedaluwarsa. Silakan login kembali."
          }
          extra={
            <Space direction="vertical" align="center">
              <Typography.Text type="secondary">Status kode: 401</Typography.Text>
              {retryAction}
              {debugText ? (
                <Typography.Paragraph
                  copyable
                  code
                  style={{ marginBottom: 0, textAlign: "left", maxWidth: 520 }}
                >
                  {debugText}
                </Typography.Paragraph>
              ) : null}
            </Space>
          }
        />
      );
    }

    if (statusCode === 404) {
      return (
        <Result
          status="404"
          title="Data tidak ditemukan"
          subTitle={responseMessage ?? "Endpoint atau data yang diminta tidak tersedia pada server."}
          extra={
            <Space direction="vertical" align="center">
              <Typography.Text type="secondary">Status kode: 404</Typography.Text>
              {retryAction}
              {debugText ? (
                <Typography.Paragraph
                  copyable
                  code
                  style={{ marginBottom: 0, textAlign: "left", maxWidth: 520 }}
                >
                  {debugText}
                </Typography.Paragraph>
              ) : null}
            </Space>
          }
        />
      );
    }

    const subtitle =
      responseMessage ?? "Terjadi kesalahan saat mengambil data dari server. Silakan coba lagi.";

    return (
      <Result
        status="error"
        title="Gagal mengambil data"
        subTitle={subtitle}
        extra={
          <Space direction="vertical" align="center">
            {statusCode ? (
              <Typography.Text type="secondary">Status kode: {statusCode}</Typography.Text>
            ) : null}
            {retryAction}
            {debugText ? (
              <Typography.Paragraph
                copyable
                code
                style={{ marginBottom: 0, textAlign: "left", maxWidth: 520 }}
              >
                {debugText}
              </Typography.Paragraph>
            ) : null}
          </Space>
        }
      />
    );
  }, [error, handleRetry, isError]);

  const columns = useMemo<ColumnsType<Record<string, unknown>>>(() => {
    const sample = (tableQueryResult?.data?.data ?? dataSource ?? []).find(
      (item) => item && typeof item === "object"
    ) as Record<string, unknown> | undefined;

    if (!sample) {
      return [
        {
          title: "Data",
          dataIndex: "_raw",
          render: (_, record) => (
            <Typography.Text code>{JSON.stringify(record, null, 2)}</Typography.Text>
          ),
        },
      ];
    }

    return Object.keys(sample).map((key) => ({
      title: formatTitle(key),
      dataIndex: key,
      ellipsis: true,
      render: (value: unknown) => {
        if (value === null || value === undefined) {
          return <Typography.Text type="secondary">—</Typography.Text>;
        }

        if (typeof value === "object") {
          return <Typography.Text code>{JSON.stringify(value)}</Typography.Text>;
        }

        return <Typography.Text>{String(value)}</Typography.Text>;
      },
    }));
  }, [dataSource, tableQueryResult?.data?.data]);

  const tableLocale = useMemo(
    () => ({
      emptyText: showLoadingState ? (
        <div
          style={{
            padding: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Spin size="large" />
          <Typography.Text>{`Memuat data ${resourceLabelLower}...`}</Typography.Text>
        </div>
      ) : showEmptyState ? (
        <Result
          status="info"
          title="Data belum tersedia"
          subTitle={`Tidak ada ${resourceLabelLower} yang bisa ditampilkan saat ini.`}
          extra={
            <Space direction="vertical" align="center">
              <Button onClick={handleRetry} type="primary">
                Muat ulang data
              </Button>
              <Typography.Text type="secondary">Endpoint: {resourceEndpoint}</Typography.Text>
            </Space>
          }
        />
      ) : (
        <Typography.Text type="secondary">Tidak ada data yang bisa ditampilkan.</Typography.Text>
      ),
    }),
    [handleRetry, resourceEndpoint, resourceLabelLower, showEmptyState, showLoadingState]
  );

  const shouldShowSpinner = showLoadingState || (hasRecords && isFetching);
  const tableLoadingProps = shouldShowSpinner ? { spinning: true, tip: "Memuat data..." } : false;

  return (
    <List title={resource?.meta?.label ?? resource?.label ?? resource?.name}>
      {errorResult}
      {!errorResult && (
        <Table
          {...restTableProps}
          dataSource={dataSource}
          columns={columns}
          loading={tableLoadingProps}
          locale={tableLocale}
          rowKey={(record) => (record as { id?: string | number }).id ?? JSON.stringify(record)}
        />
      )}
    </List>
  );
};
