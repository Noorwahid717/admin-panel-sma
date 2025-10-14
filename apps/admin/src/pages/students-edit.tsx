import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Card } from "antd";

export const StudentsEdit: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps} title="Ubah Siswa">
      <Card>
        <Form {...formProps} layout="vertical">
          <Form.Item label="Nama Lengkap" name="fullName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="ID Siswa" name="studentId" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Tanggal Lahir" name="birthDate">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
        </Form>
      </Card>
    </Edit>
  );
};
