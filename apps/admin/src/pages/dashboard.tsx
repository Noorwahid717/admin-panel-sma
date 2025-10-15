import React, { useMemo } from "react";
import { Card, Col, Progress, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import {
  InfoCircleOutlined,
  LineChartOutlined,
  RiseOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";

type DistributionBucket = {
  range: string;
  count: number;
};

type ClassSummary = {
  classId: string;
  className: string;
  average: number;
  highest: number;
  lowest: number;
};

type OutlierRecord = {
  studentId: string;
  studentName: string;
  className: string;
  subjectName: string;
  zScore: number;
  score: number;
  trend: "UP" | "DOWN";
  lastUpdated: string;
};

type RemedialRecord = {
  studentId: string;
  studentName: string;
  className: string;
  subjectName: string;
  score: number;
  kkm: number;
  attempts: number;
  lastAttempt: string;
};

type AttendanceAlert = {
  classId: string;
  className: string;
  indicator: string;
  percentage: number;
  week: string;
};

type PrincipalDashboard = {
  updatedAt: string;
  distribution: {
    overallAverage: number;
    totalStudents: number;
    byRange: DistributionBucket[];
    byClass: ClassSummary[];
  };
  outliers: OutlierRecord[];
  remedial: RemedialRecord[];
  attendance: {
    overall: number;
    byClass: Array<{ classId: string; className: string; percentage: number }>;
    alerts: AttendanceAlert[];
  };
};

const CARD_SPAN = { xs: 24, sm: 12, lg: 8 };

export const DashboardPage: React.FC = () => {
  const dashboardQuery = useList<PrincipalDashboard>({
    resource: "dashboard",
    dataProviderName: "default",
  });

  const dashboard = useMemo(() => {
    const records = (dashboardQuery.data?.data ?? []) as unknown as PrincipalDashboard[];
    return records[0];
  }, [dashboardQuery.data]);

  const loading = dashboardQuery.isLoading;

  const distributionColumns = [
    { title: "Rentang Nilai", dataIndex: "range", key: "range" },
    {
      title: "Jumlah Siswa",
      dataIndex: "count",
      key: "count",
      render: (value: number) => value.toLocaleString("id-ID"),
    },
  ];

  const classColumns = [
    { title: "Kelas", dataIndex: "className", key: "className" },
    {
      title: "Rata-rata",
      dataIndex: "average",
      key: "average",
      render: (value: number) => value.toFixed(1),
    },
    {
      title: "Nilai Tertinggi",
      dataIndex: "highest",
      key: "highest",
      render: (value: number) => value.toFixed(0),
    },
    {
      title: "Nilai Terendah",
      dataIndex: "lowest",
      key: "lowest",
      render: (value: number) => value.toFixed(0),
    },
  ];

  const outlierColumns = [
    { title: "Siswa", dataIndex: "studentName", key: "studentName" },
    { title: "Kelas", dataIndex: "className", key: "className" },
    { title: "Mapel", dataIndex: "subjectName", key: "subjectName" },
    {
      title: "Nilai",
      dataIndex: "score",
      key: "score",
      render: (value: number) => value.toFixed(0),
    },
    {
      title: "Z-Score",
      dataIndex: "zScore",
      key: "zScore",
      render: (value: number, record: OutlierRecord) => (
        <Tag color={value >= 0 ? "blue" : "volcano"}>
          {value.toFixed(1)} {record.trend === "UP" ? "↑" : "↓"}
        </Tag>
      ),
    },
    {
      title: "Update Terakhir",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      render: (value: string) => new Date(value).toLocaleString("id-ID"),
    },
  ];

  const remedialColumns = [
    { title: "Siswa", dataIndex: "studentName", key: "studentName" },
    { title: "Kelas", dataIndex: "className", key: "className" },
    { title: "Mapel", dataIndex: "subjectName", key: "subjectName" },
    {
      title: "Nilai",
      dataIndex: "score",
      key: "score",
      render: (value: number, record: RemedialRecord) => (
        <Space size="small">
          <Typography.Text type="danger">{value.toFixed(0)}</Typography.Text>
          <Typography.Text type="secondary">/ {record.kkm}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Upaya",
      dataIndex: "attempts",
      key: "attempts",
      render: (value: number) => `${value}x`,
    },
    {
      title: "Terakhir",
      dataIndex: "lastAttempt",
      key: "lastAttempt",
      render: (value: string) => new Date(`${value}T00:00:00.000Z`).toLocaleDateString("id-ID"),
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        Dashboard Akademik
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Ikhtisar performa akademik, kehadiran, serta indikator penting lain untuk kepala sekolah.
      </Typography.Paragraph>

      <Row gutter={[16, 16]}>
        <Col span={CARD_SPAN.xs} sm={CARD_SPAN.sm} lg={CARD_SPAN.lg}>
          <Card loading={loading}>
            <Statistic
              title="Rata-rata Nilai Sekolah"
              value={dashboard?.distribution.overallAverage ?? 0}
              precision={1}
              suffix={<LineChartOutlined />}
            />
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              Total siswa dipantau:{" "}
              <Typography.Text strong>
                {(dashboard?.distribution.totalStudents ?? 0).toLocaleString("id-ID")}
              </Typography.Text>
            </Typography.Paragraph>
          </Card>
        </Col>

        <Col span={CARD_SPAN.xs} sm={CARD_SPAN.sm} lg={CARD_SPAN.lg}>
          <Card loading={loading}>
            <Statistic
              title="Kehadiran Rata-rata"
              value={dashboard?.attendance.overall ?? 0}
              precision={1}
              suffix="%"
            />
            <Progress
              percent={Number((dashboard?.attendance.overall ?? 0).toFixed(1))}
              status="active"
              size="small"
              style={{ marginTop: 12 }}
            />
          </Card>
        </Col>

        <Col span={CARD_SPAN.xs} sm={CARD_SPAN.sm} lg={CARD_SPAN.lg}>
          <Card loading={loading}>
            <Statistic
              title="Perlu Remedial"
              value={(dashboard?.remedial ?? []).length}
              suffix={<WarningOutlined />}
            />
            <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
              Pantau dan tindak lanjuti siswa yang belum memenuhi KKM.
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            Distribusi Nilai
          </Space>
        }
        loading={loading}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Table
              size="small"
              pagination={false}
              columns={distributionColumns}
              dataSource={dashboard?.distribution.byRange ?? []}
              rowKey={(record: DistributionBucket) => record.range}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Table
              size="small"
              pagination={false}
              columns={classColumns}
              dataSource={dashboard?.distribution.byClass ?? []}
              rowKey={(record: ClassSummary) => record.classId}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <RiseOutlined />
                Outlier Nilai
              </Space>
            }
            loading={loading}
          >
            <Table
              size="small"
              pagination={false}
              columns={outlierColumns}
              dataSource={dashboard?.outliers ?? []}
              rowKey={(record: OutlierRecord) =>
                `${record.studentId}-${record.subjectId}-${record.lastUpdated}`
              }
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <WarningOutlined />
                Daftar Remedial
              </Space>
            }
            loading={loading}
          >
            <Table
              size="small"
              pagination={false}
              columns={remedialColumns}
              dataSource={dashboard?.remedial ?? []}
              rowKey={(record: RemedialRecord) => `${record.studentId}-${record.subjectId}`}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <LineChartOutlined />
            Alert Kehadiran
          </Space>
        }
        loading={loading}
        extra={
          <Typography.Text type="secondary">
            Terakhir diperbarui:{" "}
            {dashboard?.updatedAt ? new Date(dashboard.updatedAt).toLocaleString("id-ID") : "-"}
          </Typography.Text>
        }
      >
        <Table
          size="small"
          pagination={false}
          columns={[
            { title: "Kelas", dataIndex: "className", key: "className" },
            {
              title: "Indikator",
              dataIndex: "indicator",
              key: "indicator",
              render: (value: string) => <Tag color="volcano">{value}</Tag>,
            },
            {
              title: "Kehadiran",
              dataIndex: "percentage",
              key: "percentage",
              render: (value: number) => `${value.toFixed(1)}%`,
            },
            {
              title: "Pekan",
              dataIndex: "week",
              key: "week",
            },
          ]}
          dataSource={dashboard?.attendance.alerts ?? []}
          rowKey={(record: AttendanceAlert) => `${record.classId}-${record.week}`}
        />
      </Card>
    </Space>
  );
};
