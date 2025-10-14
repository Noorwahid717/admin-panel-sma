import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Card, Form, Input, Switch } from "antd";
import { ResourceActionGuard } from "../components/resource-action-guard";

export const TermsCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm({
    initialValues: { active: false },
  });

  return (
    <ResourceActionGuard action="create">
      <Create saveButtonProps={saveButtonProps} title="Buat Semester">
        <Card>
          <Form {...formProps} layout="vertical">
            <Form.Item label="Nama" name="name" rules={[{ required: true }]}>
              <Input placeholder="Misal: Semester Genap 2025" />
            </Form.Item>
            <Form.Item label="Tanggal Mulai" name="startDate" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item label="Tanggal Selesai" name="endDate" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item label="Aktif" name="active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Card>
      </Create>
    </ResourceActionGuard>
  );
};
