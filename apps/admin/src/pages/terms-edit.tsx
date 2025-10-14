import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Card, Form, Input, Switch } from "antd";
import dayjs from "dayjs";
import { ResourceActionGuard } from "../components/resource-action-guard";

export const TermsEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <ResourceActionGuard action="edit">
      <Edit saveButtonProps={saveButtonProps} title="Ubah Semester">
        <Card>
          <Form {...formProps} layout="vertical">
            <Form.Item label="Nama" name="name" rules={[{ required: true }]}>
              <Input placeholder="Misal: Semester Genap 2025" />
            </Form.Item>
            <Form.Item
              label="Tanggal Mulai"
              name="startDate"
              rules={[{ required: true }]}
              getValueProps={(value: unknown) => {
                if (!value) return { value: undefined };
                const formatted = dayjs(value);
                return { value: formatted.isValid() ? formatted.format("YYYY-MM-DD") : value };
              }}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item
              label="Tanggal Selesai"
              name="endDate"
              rules={[{ required: true }]}
              getValueProps={(value: unknown) => {
                if (!value) return { value: undefined };
                const formatted = dayjs(value);
                return { value: formatted.isValid() ? formatted.format("YYYY-MM-DD") : value };
              }}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item label="Aktif" name="active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Card>
      </Edit>
    </ResourceActionGuard>
  );
};
