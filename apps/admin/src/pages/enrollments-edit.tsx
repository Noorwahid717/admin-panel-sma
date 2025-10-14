import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Card, Form, Input } from "antd";
import { ResourceActionGuard } from "../components/resource-action-guard";

export const EnrollmentsEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <ResourceActionGuard action="edit">
      <Edit saveButtonProps={saveButtonProps} title="Ubah Enrol Siswa">
        <Card>
          <Form {...formProps} layout="vertical">
            <Form.Item label="ID Siswa" name="studentId" rules={[{ required: true }]}>
              <Input placeholder="Masukkan ID siswa" />
            </Form.Item>
            <Form.Item label="ID Kelas" name="classId" rules={[{ required: true }]}>
              <Input placeholder="Masukkan ID kelas" />
            </Form.Item>
            <Form.Item label="ID Semester" name="termId" rules={[{ required: true }]}>
              <Input placeholder="Masukkan ID semester" />
            </Form.Item>
          </Form>
        </Card>
      </Edit>
    </ResourceActionGuard>
  );
};
