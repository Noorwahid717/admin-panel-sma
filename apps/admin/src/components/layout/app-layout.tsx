import React from "react";
import {
  Layout,
  Menu,
  Typography,
  Space,
  Tag,
  Spin,
  Avatar,
  Tooltip,
  Button,
  type MenuProps,
} from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  CalendarOutlined,
  ClusterOutlined,
  TeamOutlined,
  ReadOutlined,
  FileTextOutlined,
  NotificationOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  ScheduleOutlined,
  ProfileOutlined,
  SlidersOutlined,
  PercentageOutlined,
  BarChartOutlined,
  AppstoreAddOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation } from "react-router-dom";
import { useGetIdentity, useList, useLogout, useNavigation } from "@refinedev/core";
import { AppBreadcrumb } from "./app-breadcrumb";

type TermRecord = {
  id: string;
  name: string;
  active?: boolean;
};

type NavItem = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  path?: string;
  resource?: string;
  children?: NavItem[];
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
};

const DEFAULT_OPEN_KEYS = ["akademik", "people", "attendance", "settings"];

const { Header, Sider, Content } = Layout;

const buildNavItems = (logout: () => void): NavItem[] => [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: <DashboardOutlined />,
    path: "/dashboard",
  },
  {
    key: "akademik",
    label: "Akademik",
    icon: <ReadOutlined />,
    children: [
      {
        key: "akademik-terms",
        label: "Tahun Ajar / Semester",
        icon: <CalendarOutlined />,
        resource: "terms",
        path: "/terms",
      },
      {
        key: "akademik-calendar",
        label: "Kalender Akademik",
        icon: <CalendarOutlined />,
        resource: "calendar",
        path: "/calendar",
      },
      {
        key: "akademik-classes",
        label: "Kelas",
        icon: <ClusterOutlined />,
        resource: "classes",
        path: "/classes",
      },
      {
        key: "akademik-schedules",
        label: "Jadwal",
        icon: <ScheduleOutlined />,
        resource: "schedules",
        path: "/schedules",
      },
      {
        key: "akademik-schedule-generator",
        label: "Generator Jadwal",
        icon: <AppstoreAddOutlined />,
        path: "/schedules/generator",
      },
      {
        key: "akademik-teacher-preferences",
        label: "Preferensi Guru",
        icon: <SettingOutlined />,
        path: "/schedules/preferences",
      },
      {
        key: "akademik-subjects",
        label: "Mapel",
        icon: <BookOutlined />,
        resource: "subjects",
        path: "/subjects",
      },
      {
        key: "akademik-grades",
        label: "Nilai & Rapor",
        icon: <FileTextOutlined />,
        resource: "grades",
        path: "/grades",
      },
      {
        key: "akademik-enrollments",
        label: "Pendaftaran",
        icon: <ProfileOutlined />,
        resource: "enrollments",
        path: "/enrollments",
      },
      {
        key: "akademik-grade-components",
        label: "Komponen Penilaian",
        icon: <SlidersOutlined />,
        resource: "grade-components",
        path: "/grade-components",
      },
      {
        key: "akademik-grade-configs",
        label: "Bobot / KKM",
        icon: <PercentageOutlined />,
        resource: "grade-configs",
        path: "/grade-configs",
      },
    ],
  },
  {
    key: "people",
    label: "Data Siswa & Guru",
    icon: <TeamOutlined />,
    children: [
      {
        key: "people-students",
        label: "Siswa",
        icon: <UserOutlined />,
        resource: "students",
        path: "/students",
      },
      {
        key: "people-teachers",
        label: "Guru",
        icon: <TeamOutlined />,
        resource: "teachers",
        path: "/teachers",
      },
      {
        key: "people-homeroom",
        label: (
          <span>
            Wali Kelas
            <Typography.Text style={{ marginLeft: 6, fontSize: 12 }} type="secondary">
              (Penempatan)
            </Typography.Text>
          </span>
        ),
        icon: <UserOutlined />,
        resource: "enrollments",
        path: "/enrollments",
      },
    ],
  },
  {
    key: "attendance",
    label: "Kehadiran",
    icon: <ScheduleOutlined />,
    children: [
      {
        key: "attendance-daily",
        label: "Absensi Harian",
        icon: <ScheduleOutlined />,
        path: "/attendance/daily",
      },
      {
        key: "attendance-summary",
        label: "Rekap Kehadiran",
        icon: <FileTextOutlined />,
        resource: "attendance",
        path: "/attendance",
      },
    ],
  },
  {
    key: "announcements",
    label: "Pengumuman",
    icon: <NotificationOutlined />,
    resource: "announcements",
    path: "/announcements",
  },
  {
    key: "notes",
    label: "Catatan",
    icon: <FileDoneOutlined />,
    resource: "behavior-notes",
    path: "/behavior-notes",
  },
  {
    key: "reports",
    label: "Laporan",
    icon: <BarChartOutlined />,
    resource: "grades",
    path: "/grades",
  },
  {
    key: "settings",
    label: "Pengaturan",
    icon: <SettingOutlined />,
    children: [
      {
        key: "settings-users",
        label: "Users & Roles",
        icon: <TeamOutlined />,
        disabled: true,
      },
      {
        key: "settings-configuration",
        label: "Konfigurasi Sekolah",
        icon: <SettingOutlined />,
        resource: "grade-configs",
        path: "/grade-configs",
      },
      {
        key: "settings-backup",
        label: "Backup / Restore",
        icon: <FileTextOutlined />,
        disabled: true,
      },
    ],
  },
  {
    key: "logout",
    label: "Logout",
    icon: <LogoutOutlined />,
    danger: true,
    onClick: logout,
  },
];

const flattenNav = (items: NavItem[], accumulator: Map<string, NavItem>) => {
  items.forEach((item) => {
    accumulator.set(item.key, item);
    if (item.children) {
      flattenNav(item.children, accumulator);
    }
  });
};

const convertToMenuItems = (items: NavItem[]): MenuProps["items"] =>
  items.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    disabled: item.disabled,
    danger: item.danger,
    children: item.children ? convertToMenuItems(item.children) : undefined,
  }));

const getItemPath = (item: NavItem): string | undefined =>
  item.path ?? (item.resource ? `/${item.resource}` : undefined);

const matchScore = (item: NavItem, pathname: string) => {
  const path = getItemPath(item);
  if (!path) {
    return -1;
  }
  if (pathname === path) {
    return path.length;
  }
  if (pathname.startsWith(`${path}/`)) {
    return path.length;
  }
  return -1;
};

const resolveActiveState = (
  items: NavItem[],
  pathname: string,
  ancestors: string[] = []
): { key?: string; ancestors: string[]; score: number } => {
  let active = { key: undefined as string | undefined, ancestors, score: -1 };

  items.forEach((item) => {
    const itemScore = matchScore(item, pathname);
    if (itemScore > active.score) {
      active = { key: item.key, ancestors, score: itemScore };
    }

    if (item.children) {
      const childActive = resolveActiveState(item.children, pathname, [...ancestors, item.key]);
      if (childActive.score > active.score) {
        active = childActive;
      }
    }
  });

  return active;
};

export const AppLayout: React.FC = () => {
  const { mutate: logoutMutate } = useLogout();
  const location = useLocation();
  const { list, push } = useNavigation();
  const { data: identity } = useGetIdentity<{ id: string; name?: string; email?: string }>();
  const { data: activeTerms, isLoading: isLoadingTerms } = useList<TermRecord>({
    resource: "terms",
    filters: [{ field: "active", operator: "eq", value: true }],
    pagination: { current: 1, pageSize: 5 },
  });
  const navItems = React.useMemo(() => buildNavItems(() => logoutMutate()), [logoutMutate]);
  const navMap = React.useMemo(() => {
    const map = new Map<string, NavItem>();
    flattenNav(navItems, map);
    return map;
  }, [navItems]);
  const menuItems = React.useMemo(() => convertToMenuItems(navItems), [navItems]);
  const activeState = React.useMemo(
    () => resolveActiveState(navItems, location.pathname),
    [navItems, location.pathname]
  );
  const selectedKeys = React.useMemo(
    () => (activeState.key ? [activeState.key] : []),
    [activeState.key]
  );
  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    const item = navMap.get(key);
    if (!item || item.disabled) {
      return;
    }
    if (item.onClick) {
      item.onClick();
      return;
    }
    if (item.resource) {
      list(item.resource);
      return;
    }
    if (item.path) {
      push(item.path);
    }
  };

  const activeTerm =
    activeTerms?.data?.find((term) => term.active) ?? activeTerms?.data?.[0] ?? null;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <Space size="middle" align="center">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "#1d4ed8",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              HN
            </div>
            <div>
              <Typography.Text strong>SMA Harapan Nusantara</Typography.Text>
              <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                Panel Administrasi
              </Typography.Text>
            </div>
          </Space>

          <Space size="small" align="center">
            <CalendarOutlined style={{ color: "#64748b" }} />
            <Typography.Text type="secondary">Tahun Ajar Aktif</Typography.Text>
            {isLoadingTerms ? (
              <Spin size="small" />
            ) : (
              <Tag color={activeTerm ? "blue" : "default"}>
                {activeTerm?.name ?? "Belum dipilih"}
              </Tag>
            )}
          </Space>

          <Space size="middle" align="center">
            <Avatar icon={<UserOutlined />} />
            <div>
              <Typography.Text strong>{identity?.name ?? "Pengguna"}</Typography.Text>
              {identity?.email ? (
                <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                  {identity.email}
                </Typography.Text>
              ) : null}
            </div>
            <Tooltip title="Pengaturan akun (segera hadir)">
              <Button type="text" icon={<SettingOutlined />} />
            </Tooltip>
          </Space>
        </div>
      </Header>

      <Layout hasSider>
        <Sider
          width={280}
          style={{
            background: "#ffffff",
            borderRight: "1px solid #e5e7eb",
            paddingTop: 16,
          }}
        >
          <Menu
            mode="inline"
            items={menuItems}
            selectedKeys={selectedKeys}
            defaultOpenKeys={DEFAULT_OPEN_KEYS}
            onClick={handleMenuClick}
            style={{ borderRight: 0, height: "100%", paddingInline: 16 }}
          />
        </Sider>
        <Layout>
          <Content
            style={{
              background: "#f8fafc",
              minHeight: "calc(100vh - 64px)",
              padding: "24px 32px",
            }}
          >
            <div
              style={{
                background: "#ffffff",
                borderRadius: 16,
                padding: 24,
                minHeight: "calc(100vh - 128px)",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
              }}
            >
              <AppBreadcrumb />
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
