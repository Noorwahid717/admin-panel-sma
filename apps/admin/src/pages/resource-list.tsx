import { useEffect, useMemo } from "react";
import { Result, Spin, Table, Typography } from "antd";
import type { AxiosError } from "axios";
import type { ColumnsType } from "antd/es/table";
import { List, useTable } from "@refinedev/antd";
import { useResource } from "@refinedev/core";

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
    isError = false,
    isFetched = false,
    isLoading = false,
    error,
  } = tableQueryResult ?? {};

  const records = (data?.data as unknown[]) ?? [];
  const hasRecords = records.length > 0;
  const showLoadingState = isLoading && !hasRecords;
  const isEmpty = !showLoadingState && isFetched && !isError && !hasRecords;

  useEffect(() => {
    if (isError) {
      console.error(`[ResourceList] Failed to fetch ${resource?.name ?? "resource"} data`, error);
    }
  }, [error, isError, resource?.name]);

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

    if (statusCode === 401) {
      return (
        <Result
          status="403"
          title="Tidak ada otorisasi"
          subTitle={
            responseMessage ??
            "Token akses tidak valid atau telah kedaluwarsa. Silakan login kembali."
          }
          extra={<Typography.Text type="secondary">Status kode: 401</Typography.Text>}
        />
      );
    }

    if (statusCode === 404) {
      return (
        <Result
          status="404"
          title="Data tidak ditemukan"
          subTitle={
            responseMessage ?? "Endpoint atau data yang diminta tidak tersedia pada server."
          }
          extra={<Typography.Text type="secondary">Status kode: 404</Typography.Text>}
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
          statusCode ? (
            <Typography.Text type="secondary">Status kode: {statusCode}</Typography.Text>
          ) : undefined
        }
      />
    );
  }, [error, isError]);

  const columns = useMemo<ColumnsType<Record<string, unknown>>>(() => {
    const sample = (tableQueryResult?.data?.data ?? tableProps?.dataSource ?? []).find(
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
  }, [tableQueryResult?.data?.data, tableProps?.dataSource]);

  return (
    <List title={resource?.meta?.label ?? resource?.label ?? resource?.name}>
      {showLoadingState && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 240,
            gap: 12,
            flexDirection: "column",
          }}
        >
          <Spin size="large" />
          <Typography.Text>Memuat data...</Typography.Text>
        </div>
      )}

      {errorResult}

      {isEmpty && (
        <Result
          status="info"
          title="Data belum tersedia"
          subTitle="Tidak ada data yang bisa ditampilkan untuk resource ini."
        />
      )}

      {!showLoadingState && !isError && !isEmpty && (
        <Table
          {...tableProps}
          loading={isLoading || tableProps?.loading}
          columns={columns}
          rowKey={(record) => (record as { id?: string | number }).id ?? JSON.stringify(record)}
        />
      )}
    </List>
  );
};
