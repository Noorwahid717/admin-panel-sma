import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Card, Form, Input, InputNumber } from "antd";
import { ResourceActionGuard } from "../components/resource-action-guard";

export const ClassesEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <ResourceActionGuard action="edit">
      <Edit saveButtonProps={saveButtonProps} title="Ubah Kelas">
        <Card>
          <Form {...formProps} layout="vertical">
            <Form.Item label="Nama Kelas" name="name" rules={[{ required: true }]}>
              <Input placeholder="Misal: Kelas 10 IPA 1" />
            </Form.Item>
            <Form.Item
              label="Tingkat"
              name="level"
              rules={[{ required: true, message: "Tingkat kelas wajib diisi" }]}
              getValueProps={(value: unknown) => {
                if (typeof value === "number") {
                  return { value };
                }
                const parsed = Number(value);
                return { value: Number.isNaN(parsed) ? undefined : parsed };
              }}
            >
              <InputNumber
                min={10}
                max={12}
                style={{ width: "100%" }}
                placeholder="Masukkan level (10-12)"
              />
            </Form.Item>
            <Form.Item label="Wali Kelas (Homeroom ID)" name="homeroomId">
              <Input placeholder="Masukkan ID wali kelas (opsional)" />
            </Form.Item>
          </Form>
        </Card>
      </Edit>
    </ResourceActionGuard>
  );
};
