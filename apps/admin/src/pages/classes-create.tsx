import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Card } from "antd";

export const ClassesCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps} title="Buat Kelas">
      <Card>
        <Form {...formProps} layout="vertical">
          <Form.Item label="Nama Kelas" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Teacher ID" name="teacherId">
            <Input />
          </Form.Item>
        </Form>
      </Card>
    </Create>
  );
};
