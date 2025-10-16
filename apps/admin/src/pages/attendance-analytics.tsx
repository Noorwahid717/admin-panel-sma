import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  List,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined, PrinterOutlined, TrophyOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import {
  useAttendanceAnalytics,
  type AttendanceStatus,
  type StudentAttendanceSummary,
} from "../hooks/use-attendance-analytics";

const { RangePicker } = DatePicker;

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; color: string; icon: string; description: string }
> = {
  H: {
    label: "Hadir",
    color: "#16a34a",
    icon: "✅",
    description: "Kehadiran penuh pada hari tersebut.",
  },
  I: {
    label: "Izin",
    color: "#facc15",
    icon: "📨",
    description: "Izin resmi dengan keterangan tertulis.",
  },
  S: {
    label: "Sakit",
    color: "#fb923c",
    icon: "💊",
    description: "Sakit disertai surat atau catatan orang tua.",
  },
  A: {
    label: "Alfa",
    color: "#ef4444",
    icon: "❌",
    description: "Tidak hadir tanpa keterangan resmi.",
  },
};

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: (
    <Space>
      <span aria-hidden>{meta.icon}</span>
      {meta.label}
    </Space>
  ),
}));

const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

type ChartPoint = { label: string; value: number };

const SimpleBarChart: React.FC<{ data: ChartPoint[]; color?: string }> = ({ data, color }) => {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 16,
        height: 220,
        padding: "8px 4px",
      }}
    >
      {data.map((point) => {
        const heightRatio = Math.max(point.value / max, 0);
        const barHeight = `${Math.max(heightRatio * 100, 4)}%`;
        return (
          <div
            key={point.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: "60%",
                minWidth: 28,
                borderRadius: 6,
                background: color ?? "#ef4444",
                transition: "height 0.3s ease",
                height: barHeight,
              }}
            />
            <Typography.Text strong>{point.value}</Typography.Text>
            <Typography.Text type="secondary">{point.label}</Typography.Text>
          </div>
        );
      })}
    </div>
  );
};

const SimpleLineChart: React.FC<{ data: ChartPoint[]; color?: string }> = ({ data, color }) => {
  const max = Math.max(...data.map((point) => point.value), 100);
  const min = 0;
  const range = Math.max(max - min, 1);
  const points = data
    .map((point, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div style={{ width: "100%", height: 240, padding: "0 4px" }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "180px" }}
      >
        <polyline
          points={points}
          fill="none"
          stroke={color ?? "#2563eb"}
          strokeWidth={2}
          strokeLinecap="round"
        />
        {data.map((point, index) => {
          const x = (index / Math.max(data.length - 1, 1)) * 100;
          const y = 100 - ((point.value - min) / range) * 100;
          return <circle key={point.label} cx={x} cy={y} r={2.5} fill={color ?? "#2563eb"} />;
        })}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          padding: "0 4px",
        }}
      >
        {data.map((point) => (
          <Typography.Text key={point.label} type="secondary">
            {point.label}
          </Typography.Text>
        ))}
      </div>
    </div>
  );
};

export const AttendanceAnalyticsPage: React.FC = () => {
  const [termId, setTermId] = useState<string | undefined>();
  const [classId, setClassId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus[]>(["H", "I", "S", "A"]);
  const [rangeValue, setRangeValue] = useState<[Dayjs, Dayjs] | null>(null);

  const analytics = useAttendanceAnalytics({
    termId,
    classId,
    range: rangeValue
      ? {
          start: rangeValue[0].format(DEFAULT_DATE_FORMAT),
          end: rangeValue[1].format(DEFAULT_DATE_FORMAT),
        }
      : undefined,
    statuses: statusFilter,
  });

  useEffect(() => {
    if (!termId && analytics.selectedTerm?.id) {
      setTermId(analytics.selectedTerm.id);
    }
  }, [analytics.selectedTerm?.id, termId]);

  useEffect(() => {
    if (!classId && analytics.selectedClass?.id) {
      setClassId(analytics.selectedClass.id);
    }
  }, [analytics.selectedClass?.id, classId]);

  useEffect(() => {
    if (!rangeValue && analytics.dateRange) {
      setRangeValue([
        dayjs(analytics.dateRange.start, DEFAULT_DATE_FORMAT),
        dayjs(analytics.dateRange.end, DEFAULT_DATE_FORMAT),
      ]);
    }
  }, [analytics.dateRange, rangeValue]);

  const tableData = useMemo(() => {
    return analytics.studentSummaries.map((summary) => ({
      key: summary.studentId,
      ...summary,
    }));
  }, [analytics.studentSummaries]);

  const columns: ColumnsType<(typeof tableData)[number]> = useMemo(
    () => [
      {
        title: "Nama Siswa",
        dataIndex: "studentName",
        width: 240,
        render: (value: string, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{value}</Typography.Text>
            <Typography.Text type="secondary">{`NIS: ${record.nis}`}</Typography.Text>
            {record.behaviorNotes ? (
              <Tag color="volcano">{`${record.behaviorNotes} catatan perilaku`}</Tag>
            ) : null}
          </Space>
        ),
      },
      ...(["H", "I", "S", "A"] as AttendanceStatus[]).map((status) => ({
        title: STATUS_META[status].label,
        dataIndex: ["counts", status],
        align: "center" as const,
        width: 80,
        render: (value: number) => (
          <Tag color={STATUS_META[status].color} style={{ margin: 0 }}>
            {value}
          </Tag>
        ),
      })),
      {
        title: "Persentase Hadir",
        dataIndex: "percentage",
        width: 160,
        render: (value: number) => (
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Progress
              percent={Number(value.toFixed(1))}
              size="small"
              strokeColor="#16a34a"
              showInfo={false}
            />
            <Typography.Text type="secondary">{formatPercentage(value)}</Typography.Text>
          </Space>
        ),
      },
    ],
    []
  );

  const alphaChartData = useMemo<ChartPoint[]>(() => {
    if (analytics.weeklyAlpha.length === 0) {
      return [];
    }
    return analytics.weeklyAlpha.map((point) => ({
      label: dayjs(point.week, DEFAULT_DATE_FORMAT).format("DD MMM"),
      value: point.alpha,
    }));
  }, [analytics.weeklyAlpha]);

  const attendanceChartData = useMemo<ChartPoint[]>(() => {
    if (analytics.weeklyAttendance.length === 0) {
      return [];
    }
    return analytics.weeklyAttendance.map((point) => ({
      label: dayjs(point.week, DEFAULT_DATE_FORMAT).format("DD MMM"),
      value: Number(point.attendance.toFixed(2)),
    }));
  }, [analytics.weeklyAttendance]);

  const handleExportCsv = useCallback(() => {
    if (analytics.studentSummaries.length === 0) {
      return;
    }

    const headers = ["Nama Siswa", "NIS", "H", "I", "S", "A", "Persentase Hadir"];
    const rows = analytics.studentSummaries.map((summary) => [
      JSON.stringify(summary.studentName),
      JSON.stringify(summary.nis),
      summary.counts.H,
      summary.counts.I,
      summary.counts.S,
      summary.counts.A,
      `${summary.percentage.toFixed(2)}%`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `rekap-kehadiran-${analytics.selectedClass?.name ?? "kelas"}-${analytics.dateRange.start}-${analytics.dateRange.end}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [
    analytics.dateRange.end,
    analytics.dateRange.start,
    analytics.selectedClass?.name,
    analytics.studentSummaries,
  ]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Rekap Kehadiran {analytics.selectedTerm ? `- ${analytics.selectedTerm.name}` : ""}
        </Typography.Title>
        <Typography.Text type="secondary">
          Analitik kehadiran terintegrasi untuk monitoring wali kelas, TU, dan kepala sekolah.
        </Typography.Text>
      </Space>

      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Typography.Text type="secondary">Tahun Ajar</Typography.Text>
            <Select
              placeholder="Pilih tahun ajar"
              style={{ width: "100%", marginTop: 8 }}
              value={termId}
              onChange={(value) => setTermId(value)}
              options={analytics.terms.map((term) => ({
                label: term.name,
                value: term.id,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Typography.Text type="secondary">Kelas</Typography.Text>
            <Select
              placeholder="Pilih kelas"
              style={{ width: "100%", marginTop: 8 }}
              value={classId}
              onChange={(value) => setClassId(value)}
              options={analytics.classes.map((klass) => ({
                label: klass.name,
                value: klass.id,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Typography.Text type="secondary">Rentang tanggal</Typography.Text>
            <RangePicker
              style={{ width: "100%", marginTop: 8 }}
              value={rangeValue}
              onChange={(value) => setRangeValue(value as [Dayjs, Dayjs] | null)}
              format="DD MMM YYYY"
              allowEmpty={[false, false]}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Typography.Text type="secondary">Status kehadiran</Typography.Text>
            <Select
              mode="multiple"
              style={{ width: "100%", marginTop: 8 }}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as AttendanceStatus[])}
              options={STATUS_OPTIONS}
              maxTagCount="responsive"
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Space align="baseline" style={{ justifyContent: "space-between", width: "100%" }}>
                <div>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Statistik Semester
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    Rata-rata kehadiran {analytics.selectedClass?.name ?? "kelas"}:{" "}
                    <Typography.Text strong>
                      {formatPercentage(analytics.stats.averageAttendance)}
                    </Typography.Text>
                  </Typography.Text>
                </div>
                <Space>
                  <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
                    Export CSV
                  </Button>
                  <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                    Cetak PDF
                  </Button>
                </Space>
              </Space>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" bordered={false} style={{ background: "#ecfdf5" }}>
                    <Typography.Text type="secondary">Total Sesi</Typography.Text>
                    <Typography.Title level={3} style={{ margin: "4px 0" }}>
                      {analytics.stats.totalSessions}
                    </Typography.Title>
                    <Typography.Text>Tercatat dalam rentang ini</Typography.Text>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" bordered={false} style={{ background: "#fef2f2" }}>
                    <Typography.Text type="secondary">Total Alfa</Typography.Text>
                    <Typography.Title level={3} style={{ margin: "4px 0" }}>
                      {analytics.stats.alphaTotal}
                    </Typography.Title>
                    <Typography.Text>
                      {analytics.stats.latestAbsenceCount > 0 && analytics.stats.latestAbsenceDate
                        ? `Terbaru: ${analytics.stats.latestAbsenceCount} siswa pada ${dayjs(
                            analytics.stats.latestAbsenceDate,
                            DEFAULT_DATE_FORMAT
                          ).format("DD MMM YYYY")}`
                        : "Tidak ada alfa terbaru"}
                    </Typography.Text>
                  </Card>
                </Col>
              </Row>

              <Card
                type="inner"
                title={
                  <Space>
                    <TrophyOutlined />
                    Top 3 siswa paling rajin hadir
                  </Space>
                }
              >
                {analytics.stats.topStudents.length === 0 ? (
                  <Empty description="Belum ada data kehadiran" />
                ) : (
                  <List
                    dataSource={analytics.stats.topStudents}
                    renderItem={(item, index) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Tag color="gold">{index + 1}</Tag>
                              <Typography.Text strong>{item.studentName}</Typography.Text>
                            </Space>
                          }
                          description={
                            <Space size={8} wrap>
                              <Typography.Text type="secondary">NIS {item.nis}</Typography.Text>
                              <Tag color="#16a34a">
                                Hadir {item.counts.H} kali ({formatPercentage(item.percentage)})
                              </Tag>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Grafik Tren Kehadiran">
            {attendanceChartData.length > 0 ? (
              <SimpleLineChart data={attendanceChartData} />
            ) : (
              <Empty description="Belum ada data tren kehadiran" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Diagram Alfa Mingguan">
            {alphaChartData.length > 0 ? (
              <SimpleBarChart data={alphaChartData} />
            ) : (
              <Empty description="Belum ada data alfa mingguan" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Catatan Status">
            <List
              dataSource={
                Object.entries(STATUS_META) as Array<[AttendanceStatus, typeof STATUS_META.H]>
              }
              renderItem={([value, meta]) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Tag color={meta.color} style={{ marginRight: 12 }}>
                        {meta.icon}
                      </Tag>
                    }
                    title={
                      <Space>
                        <Typography.Text strong>{meta.label}</Typography.Text>
                        <Tag>
                          {analytics.studentSummaries.reduce(
                            (acc, summary) => acc + summary.counts[value],
                            0
                          )}{" "}
                          kali
                        </Tag>
                      </Space>
                    }
                    description={meta.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Space align="baseline" style={{ width: "100%", justifyContent: "space-between" }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Tabel Rekap Kehadiran Siswa
            </Typography.Title>
            <Typography.Text type="secondary">
              {`Data ${analytics.dateRange.start} s/d ${analytics.dateRange.end}`}
            </Typography.Text>
          </Space>

          <Table
            dataSource={tableData}
            columns={columns}
            loading={analytics.isFetching && tableData.length === 0}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: analytics.isLoading ? "Memuat data..." : "Belum ada data kehadiran",
            }}
            scroll={{ x: 900 }}
          />
        </Space>
      </Card>
    </Space>
  );
};
