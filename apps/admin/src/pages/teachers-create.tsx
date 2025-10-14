import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Card } from "antd";

export const TeachersCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps} title="Buat Guru">
      <Card>
        <Form {...formProps} layout="vertical">
          <Form.Item label="Nama Lengkap" name="fullName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="ID Guru" name="teacherId" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input />
          </Form.Item>
        </Form>
      </Card>
    </Create>
  );
};
