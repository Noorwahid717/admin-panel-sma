import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Result, Select, Space, Spin, Table, Tooltip, Typography } from "antd";
import type { AxiosError } from "axios";
import type { ColumnsType } from "antd/es/table";
import { List, useTable } from "@refinedev/antd";
import {
  useResource,
  useNavigation,
  useDelete,
  useNotification,
  useCan,
  type CrudFilter,
} from "@refinedev/core";
import { Box, Stack, Typography as MuiTypography, useMediaQuery, useTheme } from "@mui/material";
import { Space as AntdSpace } from "antd";
import {
  FilterOutlined,
  ReloadOutlined,
  RocketOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "../components/confirm-modal";
import { ResourceActionGuard } from "../components/resource-action-guard";
import { ResponsiveList } from "../components/responsive/ResponsiveList";
import { MobileCardList } from "../components/responsive/MobileCardList";
import { FiltersBottomSheet } from "../components/responsive/FiltersBottomSheet";

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
  const resourceName = resource?.name;
  const resolvedResourceName = resourceName ?? resource?.identifier;
  const navigate = useNavigate();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const metaCreateAllowed = resource?.meta?.canCreate ?? Boolean(resource?.create);
  const metaEditAllowed = resource?.meta?.canEdit ?? Boolean(resource?.edit);
  const metaShowAllowed = resource?.meta?.canShow ?? Boolean(resource?.show ?? true);
  const metaDeleteAllowed = resource?.meta?.canDelete ?? true;

  const { data: createPermission } = useCan(
    { resource: resolvedResourceName ?? "", action: "create" },
    { queryOptions: { enabled: Boolean(resolvedResourceName) } }
  );
  const { data: editPermission } = useCan(
    { resource: resolvedResourceName ?? "", action: "edit" },
    { queryOptions: { enabled: Boolean(resolvedResourceName) } }
  );
  const { data: showPermission } = useCan(
    { resource: resolvedResourceName ?? "", action: "show" },
    { queryOptions: { enabled: Boolean(resolvedResourceName) } }
  );
  const { data: deletePermission } = useCan(
    { resource: resolvedResourceName ?? "", action: "delete" },
    { queryOptions: { enabled: Boolean(resolvedResourceName) } }
  );

  const { tableProps, tableQueryResult, setFilters, setSorters, filters, sorters } = useTable({
    resource: resolvedResourceName,
    pagination: {
      current: 1,
      pageSize: 10,
    },
    queryOptions: {
      enabled: Boolean(resolvedResourceName),
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

  const { dataSource: originalDataSource, ...restTableProps } = tableProps;

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

  const defaultSearchField =
    (resource?.meta?.searchField as string | undefined) ??
    (resource?.meta?.label === "Siswa" ? "fullName" : "name");

  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedSortField, setSelectedSortField] = useState<string | undefined>();
  const [selectedSortOrder, setSelectedSortOrder] = useState<"ascend" | "descend" | undefined>();
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);

  useEffect(() => {
    const activeSearchFilter = filters?.find(
      (filter) => "field" in filter && (filter.field as string) === defaultSearchField
    ) as CrudFilter | undefined;
    if (activeSearchFilter && "value" in activeSearchFilter) {
      setSearchValue(String(activeSearchFilter.value ?? ""));
    } else {
      setSearchValue("");
    }
  }, [filters, defaultSearchField]);

  useEffect(() => {
    if (Array.isArray(sorters) && sorters.length > 0) {
      const activeSorter = sorters[0];
      setSelectedSortField((activeSorter.field as string) ?? undefined);
      setSelectedSortOrder((activeSorter.order as "ascend" | "descend" | undefined) ?? undefined);
    } else {
      setSelectedSortField(undefined);
      setSelectedSortOrder(undefined);
    }
  }, [sorters]);

  const applySearchFilter = useCallback(
    (rawValue: string) => {
      if (!setFilters) return;
      const normalized = rawValue.trim();
      const otherFilters =
        filters
          ?.filter((filter) => "field" in filter && (filter.field as string) !== defaultSearchField)
          ?.map((filter) => filter as CrudFilter) ?? [];

      const nextFilters: CrudFilter[] = [...otherFilters];
      if (normalized.length > 0) {
        nextFilters.push({
          field: defaultSearchField,
          operator: "contains",
          value: normalized,
        });
      }

      setFilters(nextFilters, "replace");
    },
    [defaultSearchField, filters, setFilters]
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      setSearchValue(value);
      applySearchFilter(value);
    },
    [applySearchFilter]
  );

  const handleSortFieldChange = useCallback(
    (value: string | undefined) => {
      setSelectedSortField(value);
      if (!setSorters) return;
      if (!value) {
        setSorters([], "replace");
        return;
      }
      const order = selectedSortOrder ?? "ascend";
      setSorters([{ field: value, order }], "replace");
    },
    [selectedSortOrder, setSorters]
  );

  const handleSortOrderChange = useCallback(
    (order: "ascend" | "descend") => {
      setSelectedSortOrder(order);
      if (!setSorters || !selectedSortField) return;
      setSorters([{ field: selectedSortField, order }], "replace");
    },
    [selectedSortField, setSorters]
  );

  const handleResetControls = useCallback(() => {
    setSearchValue("");
    setSelectedSortField(undefined);
    setSelectedSortOrder(undefined);
    setFilters?.([], "replace");
    setSorters?.([], "replace");
  }, [setFilters, setSorters]);

  const resourceLabel = useMemo(
    () => resource?.meta?.label ?? resource?.label ?? resource?.name ?? "Resource",
    [resource?.label, resource?.meta?.label, resource?.name]
  );

  const canCreate = metaCreateAllowed && createPermission?.can !== false;
  const canEdit = metaEditAllowed && editPermission?.can !== false;
  const canShow = metaShowAllowed && showPermission?.can !== false;
  const canDelete = metaDeleteAllowed && deletePermission?.can !== false;
  const showSetupWizardLink = Boolean(resource?.meta?.showSetupWizardLink);
  const showImportStatusLink = Boolean(resource?.meta?.showImportStatusLink);

  const resourceLabelLower = resourceLabel.toLocaleLowerCase("id-ID");
  const resourceEndpoint = resource?.name ? `/${resource.name}` : "-";

  const { create, edit, show } = useNavigation();
  const { mutate: deleteOne, isLoading: isDeleting } = useDelete();
  const { open: notifyOpen } = useNotification();

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{
    id?: string | number;
    resource?: string;
  } | null>(null);

  const handleConfirmOk = () => {
    if (!confirmTarget?.resource || !confirmTarget?.id) {
      setConfirmVisible(false);
      return;
    }
    deleteOne(
      { resource: confirmTarget.resource, id: String(confirmTarget.id) },
      {
        onSuccess: () => {
          notifyOpen?.({
            type: "success",
            message: "Berhasil",
            description: "Data berhasil dihapus.",
          });
          refetch?.();
          setConfirmTarget(null);
        },
        onError: (error: any) => {
          notifyOpen?.({
            type: "error",
            message: "Gagal",
            description: error?.message ?? "Gagal menghapus data.",
          });
        },
      }
    );
    setConfirmVisible(false);
  };

  const handleConfirmCancel = () => {
    setConfirmVisible(false);
    setConfirmTarget(null);
  };

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
          subTitle={
            responseMessage ?? "Endpoint atau data yang diminta tidak tersedia pada server."
          }
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
      sorter: true,
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

  // Append CRUD action column
  const columnsWithActions = useMemo(() => {
    const base = columns.slice();
    if (!resolvedResourceName || (!canShow && !canEdit && !canDelete)) {
      return base;
    }

    base.push({
      title: "Aksi",
      key: "actions",
      width: 220,
      render: (_, record) => {
        const id = (record as any)?.id;
        if (!id) {
          return null;
        }
        return (
          <AntdSpace>
            {canShow ? (
              <Button onClick={() => show(resolvedResourceName, String(id))}>Lihat</Button>
            ) : null}
            {canEdit ? (
              <Button onClick={() => edit(resolvedResourceName, String(id))}>Ubah</Button>
            ) : null}
            {canDelete ? (
              <Button
                danger
                loading={isDeleting}
                onClick={() => {
                  setConfirmTarget({ id, resource: resolvedResourceName });
                  setConfirmVisible(true);
                }}
              >
                Hapus
              </Button>
            ) : null}
          </AntdSpace>
        );
      },
    });

    return base;
  }, [columns, resolvedResourceName, isDeleting, show, edit, canShow, canEdit, canDelete]);

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
  const columnOptions = useMemo(
    () =>
      columns
        .filter((column) => typeof column.dataIndex === "string")
        .map((column) => ({
          value: column.dataIndex as string,
          label:
            typeof column.title === "string" ? column.title : formatTitle(String(column.dataIndex)),
        })),
    [columns]
  );

  type TableColumn = ColumnsType<Record<string, unknown>>[number];

  const resolveColumnValue = (column: TableColumn | undefined, record: Record<string, unknown>) => {
    if (!column) return undefined;
    const { dataIndex } = column;
    if (Array.isArray(dataIndex)) {
      return dataIndex.reduce<unknown>((acc, key) => {
        if (acc && typeof acc === "object") {
          return (acc as Record<string, unknown>)[key];
        }
        return undefined;
      }, record);
    }
    if (typeof dataIndex === "string" || typeof dataIndex === "number") {
      return (record as Record<string, unknown>)[dataIndex];
    }
    return undefined;
  };

  const stringifyValue = (value: unknown) => {
    if (value === null || value === undefined) {
      return "—";
    }
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
    if (typeof value === "boolean") {
      return value ? "Ya" : "Tidak";
    }
    if (value instanceof Date) {
      return value.toLocaleString("id-ID");
    }
    return JSON.stringify(value);
  };

  const primitiveColumns = useMemo(
    () => columns.filter((column) => typeof column.dataIndex === "string") as TableColumn[],
    [columns]
  );

  const [primaryColumn, secondaryColumn, tertiaryColumn, ...restColumns] = primitiveColumns;
  const metaColumns = restColumns.slice(0, 4);
  const statusColumn = primitiveColumns.find((column) =>
    String(column.dataIndex).toLowerCase().includes("status")
  );
  const actionsColumn = columnsWithActions.find((column) => column.key === "actions");

  return (
    <ResourceActionGuard action="list" resourceName={resolvedResourceName}>
      <>
        <List
          title={resource?.meta?.label ?? resource?.label ?? resource?.name}
          resource={resolvedResourceName}
          headerButtons={(() => {
            const actions: React.ReactNode[] = [];
            if (showSetupWizardLink) {
              actions.push(
                <Button key="setup" icon={<RocketOutlined />} onClick={() => navigate("/setup")}>
                  Wizard Pra-Semester
                </Button>
              );
            }
            if (resource?.meta?.showGradeConfigLink) {
              actions.push(
                <Button key="grade-config" onClick={() => navigate("/grade-configs")}>
                  Konfigurasi Nilai
                </Button>
              );
            }
            if (resource?.name === "attendance") {
              actions.push(
                <Button key="daily" onClick={() => navigate("/attendance/daily")}>
                  Absensi Harian
                </Button>
              );
              actions.push(
                <Button key="lesson" onClick={() => navigate("/attendance/lesson")}>
                  Absensi Mapel
                </Button>
              );
            }
            if (canCreate && resolvedResourceName) {
              actions.push(
                <Button key="create" type="primary" onClick={() => create(resolvedResourceName)}>
                  Buat Baru
                </Button>
              );
            }
            if (showImportStatusLink) {
              actions.push(
                <Button key="import-status" onClick={() => navigate("/setup/import-status")}>
                  Status Import
                </Button>
              );
            }
            if (actions.length === 0) {
              return undefined;
            }
            return <Space>{actions}</Space>;
          })()}
        >
          {errorResult}
          {!errorResult && (
            <>
              {isMdUp ? (
                <Space
                  wrap
                  style={{ width: "100%", marginBottom: 16, justifyContent: "space-between" }}
                  align="center"
                >
                  <Space wrap>
                    <Input.Search
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      onSearch={handleSearchSubmit}
                      allowClear
                      enterButton={<SearchOutlined />}
                      placeholder={`Cari ${resourceLabelLower}`}
                      style={{ minWidth: 220 }}
                    />
                    {columnOptions.length > 0 ? (
                      <Select
                        allowClear
                        placeholder="Kolom urut"
                        style={{ minWidth: 180 }}
                        options={columnOptions}
                        value={selectedSortField}
                        onChange={(value) => handleSortFieldChange(value as string | undefined)}
                        onClear={() => handleSortFieldChange(undefined)}
                        suffixIcon={<FilterOutlined />}
                      />
                    ) : null}
                    <Button.Group>
                      <Tooltip title="Urutkan menaik">
                        <Button
                          icon={<SortAscendingOutlined />}
                          disabled={!selectedSortField}
                          type={selectedSortOrder === "ascend" ? "primary" : "default"}
                          onClick={() => handleSortOrderChange("ascend")}
                        />
                      </Tooltip>
                      <Tooltip title="Urutkan menurun">
                        <Button
                          icon={<SortDescendingOutlined />}
                          disabled={!selectedSortField}
                          type={selectedSortOrder === "descend" ? "primary" : "default"}
                          onClick={() => handleSortOrderChange("descend")}
                        />
                      </Tooltip>
                    </Button.Group>
                    <Tooltip title="Reset filter & urutan">
                      <Button icon={<ReloadOutlined />} onClick={handleResetControls} />
                    </Tooltip>
                  </Space>
                  <Typography.Text type="secondary">Endpoint: {resourceEndpoint}</Typography.Text>
                </Space>
              ) : (
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={() => setFiltersSheetOpen(true)}
                  >
                    Cari & Filter
                  </Button>
                  <Typography.Text type="secondary">Endpoint: {resourceEndpoint}</Typography.Text>
                </Stack>
              )}
              <ResponsiveList
                datagrid={
                  <Table
                    {...restTableProps}
                    dataSource={dataSource}
                    columns={columnsWithActions}
                    loading={tableLoadingProps}
                    locale={tableLocale}
                    rowKey={(record) =>
                      (record as { id?: string | number }).id ?? JSON.stringify(record)
                    }
                  />
                }
                records={dataSource as Record<string, unknown>[]}
                mobilerender={(record, index) => (
                  <MobileCardList
                    records={[record]}
                    primary={(item) => stringifyValue(resolveColumnValue(primaryColumn, item))}
                    secondary={
                      secondaryColumn
                        ? (item) => stringifyValue(resolveColumnValue(secondaryColumn, item))
                        : undefined
                    }
                    tertiary={
                      tertiaryColumn
                        ? (item) => stringifyValue(resolveColumnValue(tertiaryColumn, item))
                        : undefined
                    }
                    meta={
                      metaColumns.length
                        ? (item) =>
                            metaColumns.map((column) => (
                              <Box key={String(column.dataIndex)}>
                                <MuiTypography variant="caption" color="text.secondary">
                                  {typeof column.title === "string"
                                    ? column.title
                                    : formatTitle(String(column.dataIndex))}
                                </MuiTypography>
                                <MuiTypography variant="body2" sx={{ fontWeight: 600 }}>
                                  {stringifyValue(resolveColumnValue(column, item))}
                                </MuiTypography>
                              </Box>
                            ))
                        : undefined
                    }
                    statusChip={
                      statusColumn
                        ? (item) => {
                            const value = resolveColumnValue(statusColumn, item);
                            if (!value) return null;
                            const text = stringifyValue(value);
                            const normalized = text.toLowerCase();
                            let color: "default" | "success" | "warning" | "error" = "default";
                            if (["aktif", "active", "published", "selesai"].includes(normalized)) {
                              color = "success";
                            } else if (["pending", "draft", "menunggu"].includes(normalized)) {
                              color = "warning";
                            } else if (
                              ["nonaktif", "inactive", "banned", "hapus"].includes(normalized)
                            ) {
                              color = "error";
                            }
                            return { label: text, color };
                          }
                        : undefined
                    }
                    actions={
                      actionsColumn
                        ? (item) => (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                              {actionsColumn.render?.(null as never, item as never, index) ?? null}
                            </Box>
                          )
                        : undefined
                    }
                  />
                )}
              />
            </>
          )}
        </List>
        <ConfirmModal
          open={confirmVisible}
          title="Konfirmasi penghapusan"
          content={<div>Anda yakin ingin menghapus item ini?</div>}
          onOk={handleConfirmOk}
          onCancel={handleConfirmCancel}
          confirmLoading={isDeleting}
        />
        <FiltersBottomSheet
          open={filtersSheetOpen}
          onClose={() => setFiltersSheetOpen(false)}
          onReset={() => {
            handleResetControls();
            setFiltersSheetOpen(false);
          }}
          onApply={() => {
            handleSearchSubmit(searchValue);
            setFiltersSheetOpen(false);
          }}
        >
          <Stack spacing={2}>
            <Input.Search
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onSearch={(value) => {
                handleSearchSubmit(value);
                setFiltersSheetOpen(false);
              }}
              allowClear
              enterButton={<SearchOutlined />}
              placeholder={`Cari ${resourceLabelLower}`}
            />
            {columnOptions.length > 0 ? (
              <Select
                allowClear
                placeholder="Kolom urut"
                options={columnOptions}
                value={selectedSortField}
                onChange={(value) => handleSortFieldChange(value as string | undefined)}
                onClear={() => handleSortFieldChange(undefined)}
                suffixIcon={<FilterOutlined />}
                style={{ width: "100%" }}
              />
            ) : null}
            <Stack direction="row" spacing={1}>
              <Button
                block
                icon={<SortAscendingOutlined />}
                disabled={!selectedSortField}
                type={selectedSortOrder === "ascend" ? "primary" : "default"}
                onClick={() => handleSortOrderChange("ascend")}
              />
              <Button
                block
                icon={<SortDescendingOutlined />}
                disabled={!selectedSortField}
                type={selectedSortOrder === "descend" ? "primary" : "default"}
                onClick={() => handleSortOrderChange("descend")}
              />
            </Stack>
            <Button icon={<ReloadOutlined />} onClick={handleResetControls}>
              Reset Filter & Urutan
            </Button>
          </Stack>
        </FiltersBottomSheet>
      </>
    </ResourceActionGuard>
  );
};
