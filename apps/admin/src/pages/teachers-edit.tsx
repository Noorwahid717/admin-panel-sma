import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Card, Form, Input } from "antd";
import { ResourceActionGuard } from "../components/resource-action-guard";

export const TeachersEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <ResourceActionGuard action="edit">
      <Edit saveButtonProps={saveButtonProps} title="Ubah Guru">
        <Card>
          <Form {...formProps} layout="vertical">
            <Form.Item label="NIP" name="nip">
              <Input placeholder="Masukkan NIP (opsional)" />
            </Form.Item>
            <Form.Item label="Nama Lengkap" name="fullName" rules={[{ required: true }]}>
              <Input placeholder="Masukkan nama guru" />
            </Form.Item>
          </Form>
        </Card>
      </Edit>
    </ResourceActionGuard>
  );
};
