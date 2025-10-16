import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Modal, Select, Space, Table, Tag, Tooltip, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import { List, useTable } from "@refinedev/antd";
import {
  useCreate,
  useDelete,
  useList,
  useNavigation,
  useNotification,
  type CrudFilter,
} from "@refinedev/core";
import dayjs from "dayjs";
import { ResourceActionGuard } from "../components/resource-action-guard";

const DAY_OPTIONS = [
  { value: "1", label: "Senin" },
  { value: "2", label: "Selasa" },
  { value: "3", label: "Rabu" },
  { value: "4", label: "Kamis" },
  { value: "5", label: "Jumat" },
  { value: "6", label: "Sabtu" },
] as const;

const SLOT_START_TIMES = ["07:00", "07:50", "08:40", "09:40", "10:30", "11:20", "12:45", "13:35"];

type ScheduleResource = {
  id: string;
  classSubjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
};

type ClassSubjectResource = {
  id: string;
  classroomId: string;
  subjectId: string;
  teacherId: string;
  termId?: string;
};

type ClassResource = {
  id: string;
  name: string;
  code?: string;
};

type SubjectResource = {
  id: string;
  name: string;
  code?: string;
};

type TeacherResource = {
  id: string;
  fullName: string;
};

type TermResource = {
  id: string;
  name: string;
  active?: boolean;
  year: string;
  semester: number;
};

type EnrichedSchedule = ScheduleResource & {
  className?: string;
  classId?: string;
  teacherName?: string;
  teacherId?: string;
  subjectName?: string;
  subjectId?: string;
  termId?: string;
  dayLabel: string;
  periodLabel?: string;
};

const resolveDayLabel = (value: number) =>
  DAY_OPTIONS.find((day) => Number(day.value) === value)?.label ?? `Hari ${value}`;

const resolvePeriodLabel = (startTime?: string) => {
  if (!startTime) return undefined;
  const index = SLOT_START_TIMES.indexOf(startTime.slice(0, 5));
  if (index === -1) return undefined;
  return `${index + 1}`;
};

export const SchedulesPage: React.FC = () => {
  const { create: navigateCreate, edit } = useNavigation();
  const { open: notify } = useNotification();
  const { mutate: deleteOne } = useDelete();
  const { mutateAsync: createOne, isLoading: isDuplicating } = useCreate();

  const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
  const [selectedSemester, setSelectedSemester] = useState<string | undefined>(undefined);
  const [selectedClass, setSelectedClass] = useState<string | undefined>(undefined);
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(undefined);
  const [selectedDay, setSelectedDay] = useState<string | undefined>(undefined);
  const [searchValue, setSearchValue] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    tableProps,
    setFilters,
    tableQueryResult: { refetch } = {},
  } = useTable<ScheduleResource>({
    resource: "schedules",
    pagination: { pageSize: 20 },
    initialSorter: [
      {
        field: "dayOfWeek",
        order: "asc",
      },
    ],
  });

  const { data: classSubjectResponse, isLoading: loadingClassSubjects } =
    useList<ClassSubjectResource>({
      resource: "class-subjects",
      pagination: { current: 1, pageSize: 1000 },
    });

  const { data: classesResponse, isLoading: loadingClasses } = useList<ClassResource>({
    resource: "classes",
    pagination: { current: 1, pageSize: 500 },
  });

  const { data: subjectsResponse, isLoading: loadingSubjects } = useList<SubjectResource>({
    resource: "subjects",
    pagination: { current: 1, pageSize: 500 },
  });

  const { data: teachersResponse, isLoading: loadingTeachers } = useList<TeacherResource>({
    resource: "teachers",
    pagination: { current: 1, pageSize: 500 },
  });

  const { data: termsResponse, isLoading: loadingTerms } = useList<TermResource>({
    resource: "terms",
    pagination: { current: 1, pageSize: 200 },
  });

  const classSubjects = (classSubjectResponse?.data ?? []) as ClassSubjectResource[];
  const classes = (classesResponse?.data ?? []) as ClassResource[];
  const subjects = (subjectsResponse?.data ?? []) as SubjectResource[];
  const teachers = (teachersResponse?.data ?? []) as TeacherResource[];
  const terms = (termsResponse?.data ?? []) as TermResource[];

  useEffect(() => {
    if (selectedYear || selectedSemester) return;
    const activeTerm = terms.find((term) => term.active);
    if (activeTerm) {
      setSelectedYear(activeTerm.year);
      setSelectedSemester(String(activeTerm.semester));
    }
  }, [terms, selectedYear, selectedSemester]);

  const yearOptions = useMemo(() => {
    const uniqueYears = Array.from(new Set(terms.map((term) => term.year)));
    return uniqueYears.map((year) => ({ label: year, value: year }));
  }, [terms]);

  const classOptions = useMemo(
    () =>
      classes.map((klass) => ({
        label: klass.name,
        value: klass.id,
      })),
    [classes]
  );

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => ({
        label: teacher.fullName,
        value: teacher.id,
      })),
    [teachers]
  );

  const subjectMap = useMemo(() => {
    const map = new Map(subjects.map((subject) => [subject.id, subject]));
    return map;
  }, [subjects]);

  const classMap = useMemo(() => {
    const map = new Map(classes.map((klass) => [klass.id, klass]));
    return map;
  }, [classes]);

  const teacherMap = useMemo(() => {
    const map = new Map(teachers.map((teacher) => [teacher.id, teacher]));
    return map;
  }, [teachers]);

  const termMap = useMemo(() => {
    const map = new Map(terms.map((term) => [term.id, term]));
    return map;
  }, [terms]);

  const matchingTermIds = useMemo(() => {
    if (!selectedYear && !selectedSemester) return undefined;
    const filtered = terms.filter((term) => {
      const yearMatch = selectedYear ? term.year === selectedYear : true;
      const semesterMatch = selectedSemester ? String(term.semester) === selectedSemester : true;
      return yearMatch && semesterMatch;
    });
    return filtered.length > 0 ? filtered.map((term) => term.id) : [];
  }, [selectedYear, selectedSemester, terms]);

  const filteredClassSubjectIds = useMemo(() => {
    if (classSubjects.length === 0) {
      return [];
    }

    return classSubjects
      .filter((mapping) => {
        const classMatch = selectedClass ? mapping.classroomId === selectedClass : true;
        const teacherMatch = selectedTeacher ? mapping.teacherId === selectedTeacher : true;
        const termMatch = Array.isArray(matchingTermIds)
          ? matchingTermIds.length === 0
            ? false
            : matchingTermIds.includes(mapping.termId ?? "")
          : true;
        return classMatch && teacherMatch && termMatch;
      })
      .map((mapping) => mapping.id);
  }, [classSubjects, selectedClass, selectedTeacher, matchingTermIds]);

  useEffect(() => {
    const nextFilters: CrudFilter[] = [];

    if (selectedDay) {
      nextFilters.push({
        field: "dayOfWeek",
        operator: "eq",
        value: Number(selectedDay),
      });
    }

    if (filteredClassSubjectIds.length === 1) {
      nextFilters.push({
        field: "classSubjectId",
        operator: "eq",
        value: filteredClassSubjectIds[0],
      });
    } else if (filteredClassSubjectIds.length > 1) {
      nextFilters.push({
        field: "classSubjectId",
        operator: "in",
        value: filteredClassSubjectIds,
      });
    } else if (
      (Array.isArray(matchingTermIds) && matchingTermIds.length === 0) ||
      selectedClass ||
      selectedTeacher ||
      selectedYear ||
      selectedSemester
    ) {
      nextFilters.push({
        field: "classSubjectId",
        operator: "eq",
        value: "__no_match__",
      });
    }

    setFilters?.(nextFilters, "replace");
  }, [
    filteredClassSubjectIds,
    matchingTermIds,
    selectedClass,
    selectedDay,
    selectedSemester,
    selectedTeacher,
    selectedYear,
    setFilters,
  ]);

  const rawData = (tableProps.dataSource as ScheduleResource[] | undefined) ?? [];

  const enrichedData: EnrichedSchedule[] = useMemo(() => {
    return rawData.map((entry) => {
      const mapping = classSubjects.find((item) => item.id === entry.classSubjectId);
      const classroom = mapping ? classMap.get(mapping.classroomId) : undefined;
      const subject = mapping ? subjectMap.get(mapping.subjectId) : undefined;
      const teacher = mapping ? teacherMap.get(mapping.teacherId) : undefined;
      const term = mapping ? termMap.get(mapping.termId ?? "") : undefined;

      return {
        ...entry,
        className: classroom?.name ?? "-",
        classId: mapping?.classroomId,
        subjectName: subject?.name ?? "Tanpa Mapel",
        subjectId: mapping?.subjectId,
        teacherName: teacher?.fullName ?? "-",
        teacherId: mapping?.teacherId,
        termId: term?.id,
        dayLabel: resolveDayLabel(entry.dayOfWeek),
        periodLabel: resolvePeriodLabel(entry.startTime),
      };
    });
  }, [rawData, classSubjects, classMap, subjectMap, teacherMap, termMap]);

  const displayedData = useMemo(() => {
    const trimmed = searchValue.trim().toLowerCase();
    if (trimmed.length === 0) {
      return enrichedData;
    }
    return enrichedData.filter((item) => {
      const subject = (item.subjectName ?? "").toLowerCase();
      const classroom = (item.className ?? "").toLowerCase();
      const teacher = (item.teacherName ?? "").toLowerCase();
      return (
        subject.includes(trimmed) ||
        classroom.includes(trimmed) ||
        teacher.includes(trimmed) ||
        item.room?.toLowerCase().includes(trimmed) ||
        item.dayLabel.toLowerCase().includes(trimmed)
      );
    });
  }, [enrichedData, searchValue]);

  const handleClearFilters = () => {
    setSelectedDay(undefined);
    setSelectedClass(undefined);
    setSelectedTeacher(undefined);
    setSearchValue("");
  };

  const handleDelete = useCallback(
    (record: ScheduleResource) => {
      Modal.confirm({
        title: "Hapus jadwal?",
        content: "Tindakan ini akan menghapus jadwal pelajaran dan tidak dapat dibatalkan.",
        okText: "Hapus",
        okButtonProps: { danger: true },
        cancelText: "Batal",
        centered: true,
        onOk: () => {
          setDeletingId(record.id);
          deleteOne(
            { resource: "schedules", id: record.id },
            {
              onSuccess: async () => {
                setDeletingId(null);
                notify?.({
                  type: "success",
                  message: "Jadwal dihapus",
                });
                await refetch?.();
              },
              onError: (error: any) => {
                setDeletingId(null);
                notify?.({
                  type: "error",
                  message: "Gagal menghapus",
                  description: error?.message ?? "Tidak dapat menghapus jadwal.",
                });
              },
            }
          );
        },
      });
    },
    [deleteOne, notify, refetch]
  );

  const handleDuplicate = useCallback(
    async (record: EnrichedSchedule) => {
      const conflict = enrichedData.some(
        (entry) =>
          entry.id !== record.id &&
          entry.teacherId === record.teacherId &&
          entry.dayOfWeek === record.dayOfWeek &&
          entry.startTime === record.startTime
      );

      if (conflict) {
        notify?.({
          type: "error",
          message: "Tidak dapat menduplikasi",
          description: "Guru sudah mengajar di kelas lain pada jam ini.",
        });
        return;
      }

      try {
        await createOne({
          resource: "schedules",
          values: {
            classSubjectId: record.classSubjectId,
            dayOfWeek: record.dayOfWeek,
            startTime: record.startTime,
            endTime: record.endTime,
            room: record.room,
          },
        });

        notify?.({
          type: "success",
          message: "Jadwal diduplikasi",
          description: "Jadwal berhasil disalin untuk minggu berikutnya.",
        });
        await refetch?.();
      } catch (error) {
        notify?.({
          type: "error",
          message: "Gagal menduplikasi",
          description: error instanceof Error ? error.message : String(error),
        });
      }
    },
    [createOne, enrichedData, notify, refetch]
  );

  const columns: ColumnsType<EnrichedSchedule> = useMemo(
    () => [
      {
        title: "Hari",
        dataIndex: "dayLabel",
        sorter: (a, b) => a.dayOfWeek - b.dayOfWeek,
        width: 120,
        render: (value: string) => (
          <Space>
            <CalendarOutlined style={{ color: "#1d4ed8" }} />
            <span>{value}</span>
          </Space>
        ),
      },
      {
        title: "Jam ke",
        dataIndex: "periodLabel",
        sorter: (a, b) => (Number(a.periodLabel ?? 0) ?? 0) - (Number(b.periodLabel ?? 0) ?? 0),
        width: 100,
        render: (_: string | undefined, record) =>
          record.periodLabel ? <Tag color="blue">{record.periodLabel}</Tag> : "-",
      },
      {
        title: "Mapel",
        dataIndex: "subjectName",
        sorter: (a, b) => (a.subjectName ?? "").localeCompare(b.subjectName ?? ""),
      },
      {
        title: "Guru",
        dataIndex: "teacherName",
        sorter: (a, b) => (a.teacherName ?? "").localeCompare(b.teacherName ?? ""),
      },
      {
        title: "Kelas",
        dataIndex: "className",
        sorter: (a, b) => (a.className ?? "").localeCompare(b.className ?? ""),
      },
      {
        title: "Ruang",
        dataIndex: "room",
        width: 120,
        render: (value: string | undefined) => value ?? "-",
      },
      {
        title: "Aksi",
        key: "actions",
        width: 160,
        render: (_: unknown, record) => (
          <Space>
            <Tooltip title="Edit jadwal">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  edit("schedules", record.id);
                }}
              />
            </Tooltip>
            <Tooltip title="Duplikasi minggu berikutnya">
              <Button
                type="text"
                icon={<RedoOutlined />}
                loading={isDuplicating}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDuplicate(record);
                }}
              />
            </Tooltip>
            <Tooltip title="Hapus jadwal">
              <Button
                type="text"
                danger
                loading={deletingId === record.id}
                icon={<DeleteOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(record);
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [deletingId, edit, handleDelete, handleDuplicate, isDuplicating]
  );

  const groupedByDay = useMemo(() => {
    const groups = new Map<number, EnrichedSchedule[]>();
    displayedData.forEach((entry) => {
      const current = groups.get(entry.dayOfWeek) ?? [];
      current.push(entry);
      groups.set(entry.dayOfWeek, current);
    });
    DAY_OPTIONS.forEach((option) => {
      const key = Number(option.value);
      if (groups.has(key)) {
        groups.set(
          key,
          groups
            .get(key)!
            .slice()
            .sort((a, b) => dayjs(a.startTime, "HH:mm").diff(dayjs(b.startTime, "HH:mm")))
        );
      }
    });
    return groups;
  }, [displayedData]);

  const isLoading =
    tableProps.loading ||
    loadingClassSubjects ||
    loadingClasses ||
    loadingSubjects ||
    loadingTeachers ||
    loadingTerms;

  const { dataSource: _ignoredDataSource, ...restTableProps } = tableProps;

  return (
    <ResourceActionGuard action="list" resourceName="schedules">
      <List
        title={
          <Space direction="vertical" size={4}>
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              Jadwal Pelajaran
            </Typography.Title>
            <Typography.Text type="secondary">
              Pantau dan kelola jadwal pelajaran berdasarkan tahun ajar, kelas, guru, dan hari.
            </Typography.Text>
          </Space>
        }
        headerProps={{ style: { marginBottom: 0 } }}
        contentProps={{ style: { padding: 0 } }}
      >
        <Space direction="vertical" size={24} style={{ width: "100%", padding: 24 }}>
          <Card>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Typography.Text strong>Filter Jadwal</Typography.Text>
              <Space wrap style={{ width: "100%" }}>
                <Select
                  style={{ minWidth: 180 }}
                  placeholder="Tahun Ajar"
                  options={yearOptions}
                  value={selectedYear}
                  allowClear
                  onChange={(value) => setSelectedYear(value)}
                />
                <Select
                  style={{ minWidth: 200 }}
                  placeholder="Semester"
                  options={[
                    { label: "Semester Ganjil (1)", value: "1" },
                    { label: "Semester Genap (2)", value: "2" },
                  ]}
                  value={selectedSemester}
                  allowClear
                  onChange={(value) => setSelectedSemester(value)}
                />
                <Select
                  style={{ minWidth: 220 }}
                  placeholder="Kelas"
                  options={classOptions}
                  value={selectedClass}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => setSelectedClass(value)}
                />
                <Select
                  style={{ minWidth: 220 }}
                  placeholder="Guru"
                  options={teacherOptions}
                  value={selectedTeacher}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => setSelectedTeacher(value)}
                />
                <Select
                  style={{ minWidth: 180 }}
                  placeholder="Hari"
                  options={DAY_OPTIONS}
                  value={selectedDay}
                  allowClear
                  onChange={(value) => setSelectedDay(value)}
                />
                <Input
                  style={{ minWidth: 200 }}
                  placeholder="Cari mapel / kelas"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  allowClear
                />
                <Button onClick={handleClearFilters}>Reset</Button>
              </Space>
            </Space>
          </Card>

          <Card>
            <Space
              align="center"
              style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigateCreate("schedules")}
              >
                Tambah Jadwal
              </Button>
              <Typography.Text type="secondary">
                Total jadwal: {displayedData.length} entri
              </Typography.Text>
            </Space>

            <Table<EnrichedSchedule>
              {...restTableProps}
              rowKey="id"
              columns={columns}
              dataSource={displayedData}
              loading={isLoading}
              scroll={{ x: true }}
            />
          </Card>

          <Card title="Tampilan Mingguan">
            <Space
              align="start"
              style={{
                width: "100%",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              {DAY_OPTIONS.map((day) => {
                const dayValue = Number(day.value);
                const schedules = groupedByDay.get(dayValue) ?? [];

                return (
                  <Card
                    key={day.value}
                    size="small"
                    title={
                      <Space>
                        <CalendarOutlined />
                        <span>{day.label}</span>
                      </Space>
                    }
                    style={{ flex: "1 1 240px" }}
                  >
                    <Space direction="vertical" style={{ width: "100%" }}>
                      {schedules.length === 0 ? (
                        <Typography.Text type="secondary">Tidak ada jadwal.</Typography.Text>
                      ) : (
                        schedules.map((item) => (
                          <Card key={item.id} size="small" bordered>
                            <Space direction="vertical" size={4} style={{ width: "100%" }}>
                              <Typography.Text strong>
                                {item.subjectName ?? "Mapel"} · {item.className ?? "-"}
                              </Typography.Text>
                              <Typography.Text type="secondary">
                                {item.startTime} - {item.endTime} · {item.teacherName ?? "-"}
                              </Typography.Text>
                              <Typography.Text type="secondary">
                                Ruang {item.room ?? "-"}
                              </Typography.Text>
                            </Space>
                          </Card>
                        ))
                      )}
                    </Space>
                  </Card>
                );
              })}
            </Space>
          </Card>
        </Space>
      </List>
    </ResourceActionGuard>
  );
};
