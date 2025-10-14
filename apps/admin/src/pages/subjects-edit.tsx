import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Card, Form, Input } from "antd";
import { ResourceActionGuard } from "../components/resource-action-guard";

export const SubjectsEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <ResourceActionGuard action="edit">
      <Edit saveButtonProps={saveButtonProps} title="Ubah Mata Pelajaran">
        <Card>
          <Form {...formProps} layout="vertical">
            <Form.Item
              label="Kode"
              name="code"
              rules={[{ required: true, message: "Kode wajib diisi" }]}
            >
              <Input placeholder="Masukkan kode mata pelajaran" />
            </Form.Item>
            <Form.Item label="Nama" name="name" rules={[{ required: true }]}>
              <Input placeholder="Masukkan nama mata pelajaran" />
            </Form.Item>
          </Form>
        </Card>
      </Edit>
    </ResourceActionGuard>
  );
};
