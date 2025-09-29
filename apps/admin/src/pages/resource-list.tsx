import { useMemo } from "react";
import { Table, Typography } from "antd";
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
      <Table
        {...tableProps}
        columns={columns}
        rowKey={(record) => (record as { id?: string | number }).id ?? JSON.stringify(record)}
      />
    </List>
  );
};
