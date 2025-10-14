import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { useNotification } from "@refinedev/core";
import { Form, Input, Card } from "antd";

export const StudentsCreate: React.FC = () => {
  const { open: notify } = useNotification();
  const { formProps, saveButtonProps } = useForm({
    mutationOptions: {
      onSuccess: () =>
        notify?.({ type: "success", message: "Berhasil", description: "Siswa berhasil dibuat." }),
      onError: (err: any) =>
        notify?.({
          type: "error",
          message: "Gagal",
          description: err?.message ?? "Gagal membuat siswa.",
        }),
    },
  });

  return (
    <Create
      saveButtonProps={{
        ...saveButtonProps,
        onSuccess: () =>
          notify?.({ type: "success", message: "Berhasil", description: "Siswa berhasil dibuat." }),
        onError: (err: any) =>
          notify?.({
            type: "error",
            message: "Gagal",
            description: err?.message ?? "Gagal membuat siswa.",
          }),
      }}
      title="Buat Siswa"
    >
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
    </Create>
  );
};
