import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { RadioChangeEvent } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import {
  useDataProvider,
  useGetIdentity,
  useList,
  useNotification,
  useTranslate,
  type BaseRecord,
} from "@refinedev/core";
import { ResourceActionGuard } from "../components/resource-action-guard";
import { usePersistentSelection } from "../hooks/use-persistent-selection";
import { DownloadOutlined } from "@ant-design/icons";

type AttendanceStatus = "H" | "S" | "I" | "A";

type AttendanceFormState = Record<
  string,
  {
    status: AttendanceStatus | null;
    note: string;
  }
>;

type AttendanceRecord = {
  id: string;
  enrollmentId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  sessionType?: string;
};

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "H", label: "Hadir", color: "green" },
  { value: "S", label: "Sakit", color: "blue" },
  { value: "I", label: "Izin", color: "orange" },
  { value: "A", label: "Alpa", color: "red" },
];

const DATE_FORMAT = "YYYY-MM-DD";

export const AttendanceDailyPage: React.FC = () => {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const { value: storedClassId, setValue: setStoredClassId } = usePersistentSelection<
    string | undefined
  >("daily-class");
  const [classId, setClassId] = useState<string | undefined>(storedClassId);
  const [formState, setFormState] = useState<AttendanceFormState>({});
  const [submitting, setSubmitting] = useState(false);

  const { open: notify } = useNotification();
  const dataProvider = useDataProvider();
  const t = useTranslate();

  const classesQuery = useList({
    resource: "classes",
    pagination: { current: 1, pageSize: 100 },
  });
  const enrollmentsQuery = useList({
    resource: "enrollments",
    pagination: { current: 1, pageSize: 1000 },
  });
  const studentsQuery = useList({
    resource: "students",
    pagination: { current: 1, pageSize: 1000 },
  });
  const attendanceQuery = useList({
    resource: "attendance",
    pagination: { current: 1, pageSize: 1000 },
  });
  const { data: identity } = useGetIdentity();
  const teacherId = identity?.teacherId as string | undefined;

  const classes = (classesQuery.data?.data as BaseRecord[]) ?? [];
  const enrollments = (enrollmentsQuery.data?.data as BaseRecord[]) ?? [];
  const students = (studentsQuery.data?.data as BaseRecord[]) ?? [];
  const attendanceRecords = (attendanceQuery.data?.data as AttendanceRecord[]) ?? [];

  const enrollmentByClass = useMemo(() => {
    if (!classId) return [];
    return enrollments.filter((enrollment) => enrollment.classId === classId);
  }, [classId, enrollments]);

  const studentDictionary = useMemo(() => {
    const map = new Map<string, BaseRecord>();
    students.forEach((student) => {
      map.set(String(student.id), student);
    });
    return map;
  }, [students]);

  const existingAttendance = useMemo(() => {
    const targetDate = date.format(DATE_FORMAT);
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords
      .filter(
        (record) =>
          record.sessionType !== "Mapel" &&
          record.date === targetDate &&
          (!classId ||
            enrollmentByClass.some((enrollment) => enrollment.id === record.enrollmentId))
      )
      .forEach((record) => {
        map.set(record.enrollmentId, record);
      });
    return map;
  }, [attendanceRecords, classId, date, enrollmentByClass]);

  const effectiveRows = useMemo(() => {
    return enrollmentByClass
      .map((enrollment) => {
        const student = studentDictionary.get(String(enrollment.studentId));
        if (!student) {
          return null;
        }
        return {
          key: String(enrollment.id),
          enrollmentId: String(enrollment.id),
          studentId: String(enrollment.studentId),
          studentName: student.fullName ?? student.name ?? `ID ${student.id}`,
          studentNis: student.nis ?? "-",
          existing: existingAttendance.get(String(enrollment.id)),
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }, [enrollmentByClass, existingAttendance, studentDictionary]);

  React.useEffect(() => {
    if (classId !== storedClassId) {
      setStoredClassId(classId);
    }
  }, [classId, setStoredClassId, storedClassId]);

  React.useEffect(() => {
    if (!classId && storedClassId) {
      setClassId(storedClassId);
    }
  }, [classId, storedClassId]);

  React.useEffect(() => {
    if (!classId && teacherId) {
      const teacherClassrooms = classes.filter(
        (cls) => String(cls.homeroomId) === String(teacherId)
      );
      if (teacherClassrooms.length === 1) {
        setClassId(String(teacherClassrooms[0].id));
      }
    }
  }, [classId, classes, teacherId]);

  const ensureFormState = useCallback(() => {
    const next: AttendanceFormState = {};
    effectiveRows.forEach((row) => {
      const existing = existingAttendance.get(row.enrollmentId);
      next[row.enrollmentId] = {
        status: existing?.status ?? null,
        note: existing?.note ?? "",
      };
    });
    setFormState(next);
  }, [effectiveRows, existingAttendance]);

  React.useEffect(() => {
    ensureFormState();
  }, [ensureFormState]);

  const historyRecords = useMemo(() => {
    if (!classId) {
      return [];
    }
    const targets = new Set(enrollmentByClass.map((item) => String(item.id)));
    return attendanceRecords.filter((record) => {
      if (record.sessionType === "Mapel") return false;
      if (!targets.has(record.enrollmentId)) return false;
      const recordDate = dayjs(record.date);
      return recordDate.isSameOrBefore(date) && recordDate.isAfter(date.clone().subtract(7, "day"));
    });
  }, [attendanceRecords, classId, date, enrollmentByClass]);

  const historySummary = useMemo(() => {
    const summary = new Map<AttendanceStatus, number>();
    historyRecords.forEach((record) => {
      summary.set(record.status, (summary.get(record.status) ?? 0) + 1);
    });
    return STATUS_OPTIONS.map((option) => ({
      ...option,
      count: summary.get(option.value) ?? 0,
    }));
  }, [historyRecords]);

  const warningStudents = useMemo(() => {
    const counter = new Map<string, number>();
    historyRecords.forEach((record) => {
      if (record.status === "A") {
        counter.set(record.enrollmentId, (counter.get(record.enrollmentId) ?? 0) + 1);
      }
    });
    return effectiveRows
      .filter((row) => (counter.get(row.enrollmentId) ?? 0) >= 2)
      .map((row) => row.studentName);
  }, [effectiveRows, historyRecords]);

  const downloadCsv = useCallback(() => {
    if (!classId) return;
    const headers = ["Tanggal", "Siswa", "Status", "Catatan"];
    const rows = historyRecords
      .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))
      .map((record) => {
        const enrollment = enrollmentByClass.find(
          (item) => String(item.id) === record.enrollmentId
        );
        const student = enrollment ? studentDictionary.get(String(enrollment.studentId)) : null;
        const label =
          STATUS_OPTIONS.find((item) => item.value === record.status)?.label ?? record.status;
        return [
          record.date,
          student?.fullName ?? `ID ${record.enrollmentId}`,
          label,
          record.note ?? "",
        ];
      });
    const csvContent = [headers, ...rows].map((cols) => cols.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absensi-harian-${classId}-${date.format(DATE_FORMAT)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [classId, date, enrollmentByClass, historyRecords, studentDictionary]);

  const handleStatusChange = (enrollmentId: string, event: RadioChangeEvent) => {
    const value = event.target.value as AttendanceStatus;
    setFormState((prev) => ({
      ...prev,
      [enrollmentId]: {
        status: value,
        note: prev[enrollmentId]?.note ?? "",
      },
    }));
  };

  const handleNoteChange = (enrollmentId: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [enrollmentId]: {
        status: prev[enrollmentId]?.status ?? null,
        note: value,
      },
    }));
  };

  const validateBeforeSubmit = () => {
    const missing: string[] = [];
    const noteRequired: string[] = [];

    effectiveRows.forEach((row) => {
      const state = formState[row.enrollmentId];
      if (!state || !state.status) {
        missing.push(row.studentName);
      } else if ((state.status === "S" || state.status === "I") && !state.note.trim()) {
        noteRequired.push(row.studentName);
      }
    });

    if (missing.length > 0) {
      notify?.({
        type: "warning",
        message: "Lengkapi status kehadiran",
        description: `Masih ada ${missing.length} siswa tanpa status: ${missing.join(", ")}`,
      });
      return false;
    }

    if (noteRequired.length > 0) {
      notify?.({
        type: "warning",
        message: "Catatan wajib untuk Sakit/Izin",
        description: noteRequired.join(", "),
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!classId) {
      notify?.({
        type: "warning",
        message: "Pilih kelas terlebih dahulu",
      });
      return;
    }
    if (effectiveRows.length === 0) {
      notify?.({
        type: "info",
        message: "Tidak ada siswa",
        description: "Kelas ini belum memiliki siswa terdaftar.",
      });
      return;
    }

    if (!validateBeforeSubmit()) {
      return;
    }

    const targetDate = date.format(DATE_FORMAT);

    try {
      setSubmitting(true);

      await Promise.all(
        effectiveRows.map((row) => {
          const payload = formState[row.enrollmentId];
          const existing = existingAttendance.get(row.enrollmentId);
          if (!payload || !payload.status) {
            return Promise.resolve();
          }

          const values = {
            enrollmentId: row.enrollmentId,
            date: targetDate,
            status: payload.status,
            note: payload.note.trim() || undefined,
            sessionType: "Harian",
          };

          if (existing) {
            return dataProvider.update({
              resource: "attendance",
              id: existing.id,
              variables: values,
            });
          }

          return dataProvider.create({
            resource: "attendance",
            variables: values,
          });
        })
      );

      const successSummary = STATUS_OPTIONS.map((option) => {
        const count = effectiveRows.filter(
          (row) => formState[row.enrollmentId]?.status === option.value
        ).length;
        return `${option.label}: ${count}`;
      }).join(" · ");
      notify?.({
        type: "success",
        message: "Absensi tersimpan",
        description: successSummary,
      });
      await attendanceQuery.refetch?.();
    } catch (error) {
      notify?.({
        type: "error",
        message: "Gagal menyimpan absensi",
        description:
          error instanceof Error ? error.message : t("errors.httpError", "Terjadi kesalahan."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "NIS",
      dataIndex: "studentNis",
      width: 120,
    },
    {
      title: "Nama Siswa",
      dataIndex: "studentName",
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_: unknown, record: (typeof effectiveRows)[number]) => (
        <Radio.Group
          value={formState[record.enrollmentId]?.status ?? null}
          onChange={(event) => handleStatusChange(record.enrollmentId, event)}
        >
          {STATUS_OPTIONS.map((option) => (
            <Radio.Button key={option.value} value={option.value}>
              <Tag color={option.color} style={{ marginRight: 0 }}>
                {option.label}
              </Tag>
            </Radio.Button>
          ))}
        </Radio.Group>
      ),
    },
    {
      title: "Catatan",
      dataIndex: "note",
      width: 260,
      render: (_: unknown, record: (typeof effectiveRows)[number]) => {
        const status = formState[record.enrollmentId]?.status;
        return (
          <Input.TextArea
            allowClear
            autoSize={{ minRows: 1, maxRows: 3 }}
            value={formState[record.enrollmentId]?.note ?? ""}
            onChange={(event) => handleNoteChange(record.enrollmentId, event.target.value)}
            placeholder={
              status === "S" || status === "I" ? "Wajib isi alasan untuk Sakit/Izin" : "Opsional"
            }
          />
        );
      },
    },
    {
      title: "Riwayat",
      dataIndex: "existing",
      render: (existing: AttendanceRecord | undefined) =>
        existing ? (
          <Space direction="vertical" size={4}>
            <Tag
              color={
                STATUS_OPTIONS.find((item) => item.value === existing.status)?.color ?? undefined
              }
            >
              {STATUS_OPTIONS.find((item) => item.value === existing.status)?.label ??
                existing.status}
            </Tag>
            {existing.note ? (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {existing.note}
              </Typography.Text>
            ) : null}
          </Space>
        ) : (
          <Typography.Text type="secondary">Belum ada</Typography.Text>
        ),
    },
  ];

  return (
    <ResourceActionGuard action="create" resourceName="attendance">
      <div style={{ padding: 24 }}>
        <Space direction="vertical" size={24} style={{ width: "100%" }}>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            Absensi Harian Wali Kelas
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Pilih kelas dan tanggal, lalu tandai status kehadiran siswa. Status Sakit/Izin wajib
            disertai catatan singkat.
          </Typography.Paragraph>
          <Card>
            <Form layout="inline">
              <Form.Item label="Kelas" required>
                <Select
                  showSearch
                  placeholder="Pilih kelas"
                  value={classId}
                  onChange={(value) => setClassId(value)}
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  options={classes.map((cls) => ({
                    value: String(cls.id),
                    label: cls.name ?? `Kelas ${cls.id}`,
                  }))}
                  style={{ minWidth: 240 }}
                />
              </Form.Item>
              <Form.Item label="Tanggal" required>
                <DatePicker value={date} onChange={(value) => value && setDate(value)} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={handleSubmit} loading={submitting}>
                  Simpan Absensi
                </Button>
              </Form.Item>
            </Form>
          </Card>
          {!classId ? (
            <Alert
              type="info"
              showIcon
              message="Pilih kelas untuk mulai mencatat absensi."
              style={{ marginBottom: 0 }}
            />
          ) : (
            <Card>
              {warningStudents.length > 0 ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Perhatian"
                  description={`Siswa dengan catatan alpa ≥ 2 kali dalam 7 hari: ${warningStudents.join(
                    ", "
                  )}`}
                  style={{ marginBottom: 16 }}
                />
              ) : null}
              <Table
                size="small"
                dataSource={effectiveRows}
                columns={columns}
                rowKey={(record) => record.enrollmentId}
                pagination={false}
                locale={{
                  emptyText: "Tidak ada siswa pada kelas ini.",
                }}
              />
              <Space style={{ marginTop: 16 }}>
                {historySummary.map((item) => (
                  <Tag key={item.value} color={item.count > 0 ? item.color : undefined}>
                    {item.label}: {item.count}
                  </Tag>
                ))}
                <Button icon={<DownloadOutlined />} onClick={downloadCsv}>
                  Unduh CSV 7 Hari Terakhir
                </Button>
              </Space>
            </Card>
          )}
        </Space>
      </div>
    </ResourceActionGuard>
  );
};
