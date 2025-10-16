import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  AppstoreAddOutlined,
  CheckOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useScheduleGenerator } from "../hooks/use-schedule-generator";
import type { ScheduleSlot, TeacherCard, TeacherPreference } from "../hooks/use-schedule-generator";

const STATUS_COLORS: Record<ScheduleSlot["status"], string> = {
  EMPTY: "#f1f5f9",
  PREFERENCE: "#bbf7d0",
  COMPROMISE: "#fef08a",
  CONFLICT: "#fecaca",
};

const hoverPreferenceMatch = (
  preference: TeacherPreference | undefined,
  day: number,
  slot: number
) => {
  if (!preference) return false;
  return preference.preferredDays.includes(day) && preference.preferredSlots.includes(slot);
};

const TeacherItem: React.FC<{
  teacher: TeacherCard;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDragStart: (teacherId: string) => void;
  onDragEnd: () => void;
}> = ({ teacher, onMouseEnter, onMouseLeave, onDragStart, onDragEnd }) => {
  const availabilityColor =
    teacher.color === "success" ? "#16a34a" : teacher.color === "warning" ? "#f59e0b" : "#dc2626";

  return (
    <Card
      size="small"
      bordered
      style={{
        marginBottom: 12,
        borderLeft: `4px solid ${availabilityColor}`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      draggable
      onDragStart={(event) => {
        onDragStart(teacher.id);
        event.dataTransfer.setData("text/teacher-id", teacher.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={onDragEnd}
    >
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Space>
          <Tag
            color={
              teacher.color === "success" ? "green" : teacher.color === "warning" ? "gold" : "red"
            }
          >
            <UserOutlined />
          </Tag>
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{teacher.name}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {teacher.subjectNames.join(", ") || "Mapel belum ditentukan"}
            </Typography.Text>
          </Space>
        </Space>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {teacher.preferredSummary}
        </Typography.Text>
        <Space size={8} wrap>
          <Tag color="blue">Beban: {teacher.assignedCount} slot</Tag>
          <Tag color="purple">Mapel: {teacher.totalSessions}</Tag>
        </Space>
      </Space>
    </Card>
  );
};

const ScheduleCell: React.FC<{
  slot: ScheduleSlot & { key: string };
  teacherName?: string;
  subjectName?: string;
  hovered: boolean;
  preferenceMatch: boolean;
  onDrop: (teacherId: string) => void;
  onClear: () => void;
  onToggleLock: () => void;
}> = ({
  slot,
  teacherName,
  subjectName,
  hovered,
  preferenceMatch,
  onDrop,
  onClear,
  onToggleLock,
}) => {
  const background = slot.teacherId ? STATUS_COLORS[slot.status] : STATUS_COLORS.EMPTY;
  const borderColor = hovered && preferenceMatch ? "#22c55e" : "#e2e8f0";

  const tooltipTitle = slot.teacherId
    ? `${teacherName ?? slot.teacherId} · ${subjectName ?? slot.subjectId ?? "-"}`
    : "Kosong";

  return (
    <Tooltip title={tooltipTitle} destroyTooltipOnHide>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const teacherId = event.dataTransfer.getData("text/teacher-id");
          if (teacherId) {
            onDrop(teacherId);
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          onClear();
        }}
        onDoubleClick={onToggleLock}
        style={{
          minHeight: 78,
          borderRadius: 10,
          border: `2px dashed ${borderColor}`,
          background,
          padding: 8,
          position: "relative",
          boxShadow: hovered && preferenceMatch ? "0 0 0 2px rgba(34,197,94,0.4)" : undefined,
        }}
      >
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {teacherName ?? (slot.teacherId ? slot.teacherId : "Kosong")}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {subjectName ?? slot.subjectId ?? "Belum ada mapel"}
          </Typography.Text>
        </Space>
        {slot.locked ? (
          <Tag color="blue" style={{ position: "absolute", top: 6, right: 6 }}>
            <LockOutlined />
          </Tag>
        ) : null}
        {!slot.teacherId ? (
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11, position: "absolute", bottom: 6, right: 6 }}
          >
            Drop guru
          </Typography.Text>
        ) : null}
      </div>
    </Tooltip>
  );
};

const FairnessTable: React.FC<{
  data: ReturnType<typeof useScheduleGenerator>["fairnessSummary"];
}> = ({ data }) => {
  const columns = useMemo(
    () => [
      { title: "Guru", dataIndex: "teacherName", key: "teacher" },
      { title: "Hari", dataIndex: "daysCount", key: "days", align: "center" as const },
      { title: "Slot", dataIndex: "sessionCount", key: "sessions", align: "center" as const },
    ],
    []
  );

  return (
    <Table size="small" rowKey="teacherId" columns={columns} dataSource={data} pagination={false} />
  );
};

export const ScheduleGeneratorPage: React.FC = () => {
  const [termId, setTermId] = useState<string | undefined>();
  const [classId, setClassId] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm] = Form.useForm();

  const {
    isLoading,
    isFetching,
    isGenerating,
    isSaving,
    terms,
    classes,
    subjects,
    teachers,
    preferences,
    daySchedules,
    hoveredTeacherId,
    setHoveredTeacherId,
    assignTeacherToSlot,
    clearSlot,
    toggleLock,
    generateSchedule,
    saveSchedule,
    fairnessSummary,
    generateSummary,
  } = useScheduleGenerator({ termId, classId });

  useEffect(() => {
    if (!termId && terms.length > 0) {
      const active = terms.find((term) => (term as { active?: boolean }).active) ?? terms[0];
      setTermId(active.id);
    }
  }, [termId, terms]);

  useEffect(() => {
    if (!classId && classes.length > 0) {
      setClassId(classes[0].id);
    }
  }, [classId, classes]);

  const teacherNameMap = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach((teacher) => map.set(teacher.id, teacher.name));
    return map;
  }, [teachers]);

  const subjectNameMap = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((subject) => map.set(subject.id, subject.name));
    return map;
  }, [subjects]);

  const filteredTeachers = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) {
      return teachers;
    }
    return teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(keyword) ||
        teacher.subjectNames.some((name) => name.toLowerCase().includes(keyword))
    );
  }, [searchValue, teachers]);

  const preferenceLookup = useMemo(() => {
    const map = new Map<string, TeacherPreference>();
    preferences.forEach((pref) => map.set(pref.teacherId, pref));
    return map;
  }, [preferences]);

  const handleTeacherDragStart = useCallback(
    (teacherId: string) => {
      setHoveredTeacherId(teacherId);
    },
    [setHoveredTeacherId]
  );

  const handleTeacherDragEnd = useCallback(() => {
    setHoveredTeacherId(null);
  }, [setHoveredTeacherId]);

  const summaryBadge = generateSummary ? (
    <Space>
      <Tag color="green">Preferensi {generateSummary.preferenceMatches}</Tag>
      <Tag color="gold">Kompromi {generateSummary.compromise}</Tag>
      <Tag color="red">Konflik {generateSummary.conflicts}</Tag>
      <Tag color="default">Kosong {generateSummary.empty}</Tag>
      <Badge status="processing" text={`Confidence ${generateSummary.confidence}%`} />
    </Space>
  ) : null;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Generator Jadwal Otomatis
        </Typography.Title>
        <Typography.Text type="secondary">
          Susun jadwal semester berdasarkan preferensi guru dan distribusi beban mengajar.
        </Typography.Text>
      </Space>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Typography.Text type="secondary">Tahun Ajar</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Pilih tahun ajar"
              value={termId}
              options={terms.map((term) => ({ label: term.name, value: term.id }))}
              onChange={setTermId}
            />
          </Col>
          <Col xs={24} md={6}>
            <Typography.Text type="secondary">Kelas</Typography.Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Pilih kelas"
              value={classId}
              options={classes.map((klass) => ({ label: klass.name, value: klass.id }))}
              onChange={setClassId}
            />
          </Col>
          <Col xs={24} md={12}>
            <Space style={{ marginTop: 24, width: "100%", justifyContent: "flex-end" }} size={8}>
              <Button icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)}>
                Aturan & Preferensi
              </Button>
              <Button
                loading={isGenerating}
                icon={<ReloadOutlined />}
                type="default"
                onClick={generateSchedule}
              >
                Generate Otomatis
              </Button>
              <Button
                loading={isSaving}
                icon={<SaveOutlined />}
                type="primary"
                onClick={saveSchedule}
              >
                Simpan Jadwal
              </Button>
            </Space>
          </Col>
        </Row>
        {summaryBadge ? <Divider /> : null}
        {summaryBadge}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={7} xl={6}>
          <Card
            title="Daftar Guru"
            extra={
              <Input
                placeholder="Cari guru..."
                allowClear
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            }
            style={{ maxHeight: "80vh", overflow: "hidden" }}
          >
            <div style={{ maxHeight: 480, overflow: "auto", paddingRight: 8 }}>
              {filteredTeachers.length === 0 ? (
                <Spin spinning={isLoading || isFetching}>
                  <Typography.Text type="secondary">Tidak ada data guru</Typography.Text>
                </Spin>
              ) : (
                filteredTeachers.map((teacher) => (
                  <TeacherItem
                    key={teacher.id}
                    teacher={teacher}
                    onMouseEnter={() => setHoveredTeacherId(teacher.id)}
                    onMouseLeave={() => setHoveredTeacherId(null)}
                    onDragStart={handleTeacherDragStart}
                    onDragEnd={handleTeacherDragEnd}
                  />
                ))
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={17} xl={18}>
          <Card title="Grid Jadwal Mingguan">
            {isLoading ? (
              <Space style={{ width: "100%", justifyContent: "center" }}>
                <Spin />
              </Space>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ width: 80 }} />
                      {daySchedules.map((day) => (
                        <th key={day.value} style={{ textAlign: "center", paddingBottom: 8 }}>
                          <Typography.Text strong>{day.label}</Typography.Text>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map((slotValue) => (
                      <tr key={slotValue}>
                        <td style={{ padding: "12px 8px", verticalAlign: "top" }}>
                          <Space size={4} direction="vertical">
                            <Typography.Text strong>Jam {slotValue}</Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs()
                                .hour(7 + slotValue - 1)
                                .minute(0)
                                .format("HH:mm")}
                            </Typography.Text>
                          </Space>
                        </td>
                        {daySchedules.map((day) => {
                          const slot = day.slots.find((item) => item.slot === slotValue)!;
                          const preference = slot.teacherId
                            ? preferenceLookup.get(slot.teacherId)
                            : hoveredTeacherId
                              ? preferenceLookup.get(hoveredTeacherId)
                              : undefined;
                          const highlightTeacherId =
                            hoveredTeacherId ?? slot.teacherId ?? undefined;
                          const match = highlightTeacherId
                            ? hoverPreferenceMatch(
                                preferenceLookup.get(highlightTeacherId),
                                day.value,
                                slotValue
                              )
                            : false;
                          const teacherName = slot.teacherId
                            ? teacherNameMap.get(slot.teacherId)
                            : undefined;
                          const subjectName = slot.subjectId
                            ? subjectNameMap.get(slot.subjectId)
                            : undefined;
                          return (
                            <td key={day.value} style={{ padding: 6, verticalAlign: "top" }}>
                              <ScheduleCell
                                slot={slot}
                                teacherName={teacherName}
                                subjectName={subjectName}
                                hovered={Boolean(hoveredTeacherId)}
                                preferenceMatch={match}
                                onDrop={(teacherId) => {
                                  assignTeacherToSlot(teacherId, slot.key);
                                  setHoveredTeacherId(null);
                                }}
                                onClear={() => clearSlot(slot.key)}
                                onToggleLock={() => toggleLock(slot.key)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Distribusi Fairness">
            <FairnessTable data={fairnessSummary} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Progress Kesesuaian" bordered>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              <Space align="center" size={12}>
                <Progress
                  type="circle"
                  percent={generateSummary ? generateSummary.confidence : 0}
                  strokeColor="#22c55e"
                />
                <Space direction="vertical" size={4}>
                  <Typography.Text>Persentase sesuai preferensi</Typography.Text>
                  <Typography.Text type="secondary">
                    Target minimal 90% untuk jadwal final.
                  </Typography.Text>
                </Space>
              </Space>
              <Space>
                <Tag color="green" icon={<CheckOutlined />}>
                  Sesuaikan preferensi
                </Tag>
                <Tag color="gold" icon={<ExclamationCircleOutlined />}>
                  Perlu review manual
                </Tag>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Drawer
        title="Aturan & Preferensi Guru"
        placement="right"
        width={420}
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
      >
        <Form
          layout="vertical"
          form={settingsForm}
          initialValues={{
            avoidBackToBack: true,
            maxFiveDays: true,
            fairness: true,
            respectBreaks: true,
            prioritizePreferences: true,
            preferenceWeight: 40,
            fairnessWeight: 30,
            slotBalanceWeight: 20,
            randomWeight: 10,
          }}
        >
          <Typography.Title level={5}>Opsi Penjadwalan</Typography.Title>
          <Form.Item
            label="Hindari guru mengajar dua kali berturut-turut"
            name="avoidBackToBack"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label="Maksimal 5 hari mengajar per minggu"
            name="maxFiveDays"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item label="Distribusi hari merata" name="fairness" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Perhatikan jam istirahat" name="respectBreaks" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            label="Prioritaskan preferensi guru"
            name="prioritizePreferences"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />
          <Typography.Title level={5}>Bobot Prioritas</Typography.Title>
          <Form.Item label="Preferensi Guru" name="preferenceWeight">
            <Input type="number" suffix="%" />
          </Form.Item>
          <Form.Item label="Pemerataan Hari" name="fairnessWeight">
            <Input type="number" suffix="%" />
          </Form.Item>
          <Form.Item label="Pemerataan Jam" name="slotBalanceWeight">
            <Input type="number" suffix="%" />
          </Form.Item>
          <Form.Item label="Randomisasi" name="randomWeight">
            <Input type="number" suffix="%" />
          </Form.Item>

          <Button type="primary" icon={<AppstoreAddOutlined />}>
            Terapkan Aturan
          </Button>
        </Form>
      </Drawer>
    </Space>
  );
};

const SLOTS = Array.from({ length: 8 }, (_, index) => index + 1);
