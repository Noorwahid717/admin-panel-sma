import React from "react";
import { Create, useForm } from "@refinedev/antd";
import { Card, Form, Input, Select } from "antd";
import { ResourceActionGuard } from "../components/resource-action-guard";

const sessionTypeOptions = [
  { value: "Harian", label: "Harian" },
  { value: "Mapel", label: "Mapel" },
];

const statusOptions = [
  { value: "H", label: "Hadir" },
  { value: "I", label: "Izin" },
  { value: "S", label: "Sakit" },
  { value: "A", label: "Alpa" },
];

export const AttendanceCreate: React.FC = () => {
  const { formProps, saveButtonProps } = useForm();

  return (
    <ResourceActionGuard action="create">
      <Create saveButtonProps={saveButtonProps} title="Catat Kehadiran">
        <Card>
          <Form {...formProps} layout="vertical">
            <Form.Item label="ID Enrollment" name="enrollmentId" rules={[{ required: true }]}>
              <Input placeholder="Masukkan ID enrollment" />
            </Form.Item>
            <Form.Item label="Tanggal" name="date" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item label="Jenis Sesi" name="sessionType" rules={[{ required: true }]}>
              <Select options={sessionTypeOptions} placeholder="Pilih jenis sesi" />
            </Form.Item>
            <Form.Item label="Status" name="status" rules={[{ required: true }]}>
              <Select options={statusOptions} placeholder="Pilih status" />
            </Form.Item>
            <Form.Item label="ID Mata Pelajaran" name="subjectId">
              <Input placeholder="Masukkan ID mata pelajaran (opsional)" />
            </Form.Item>
            <Form.Item label="ID Guru" name="teacherId">
              <Input placeholder="Masukkan ID guru (opsional)" />
            </Form.Item>
          </Form>
        </Card>
      </Create>
    </ResourceActionGuard>
  );
};
