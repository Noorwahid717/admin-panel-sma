import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Card } from "antd";

export const SubjectsCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps} title="Buat Subject">
      <Card>
        <Form {...formProps} layout="vertical">
          <Form.Item label="Nama" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Card>
    </Create>
  );
};
