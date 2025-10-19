import React from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useList, useNavigation } from "@refinedev/core";
import { BarChart3, Users, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import type { Theme } from "@mui/material/styles";

import { SummaryCard } from "../components/dashboard/summary-card";
import { themeTokens } from "../theme/tokens";
import { formatWeekLabel, percent } from "../utils/format";

const EMPTY_MESSAGE = "Belum ada data. Tambahkan siswa/guru terlebih dulu.";

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

type AttendanceByClass = {
  classId: string;
  className: string;
  percentage: number;
};

type AttendanceAlert = {
  classId: string;
  className: string;
  indicator: string;
  percentage: number;
  week: string;
  trend?: number[];
};

type PrincipalDashboard = {
  updatedAt: string;
  distribution: {
    overallAverage: number;
    totalStudents: number;
    byRange: DistributionBucket[];
    byClass: ClassSummary[];
  };
  remedial: { studentId: string }[];
  attendance: {
    overall: number;
    byClass: AttendanceByClass[];
    alerts: AttendanceAlert[];
  };
};

type Order = "asc" | "desc";

const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 4,
  columns = 3,
}) => (
  <Box role="status" aria-live="polite" sx={{ py: 2 }}>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Stack direction="row" spacing={2} key={`skeleton-row-${rowIndex}`} sx={{ mb: 1 }}>
        {Array.from({ length: columns }).map((__, columnIndex) => (
          <Skeleton
            key={`skeleton-cell-${rowIndex}-${columnIndex}`}
            variant="rounded"
            height={24}
            width={`${80 + columnIndex * 30}px`}
            sx={{ flex: 1 }}
          />
        ))}
      </Stack>
    ))}
  </Box>
);

const EmptyState: React.FC<{ message?: string }> = ({ message = EMPTY_MESSAGE }) => (
  <Box py={6} textAlign="center">
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

const scoreColor = (score: number, palette: Theme["palette"]) => {
  if (score >= 90) return palette.success.main;
  if (score >= 80) return palette.primary.main;
  if (score >= 70) return palette.warning.main;
  return palette.error.main;
};

export const DashboardPage: React.FC = () => {
  const { list, push } = useNavigation();
  const dashboardQuery = useList<PrincipalDashboard>({
    resource: "dashboard",
    dataProviderName: "default",
  });

  const theme = useTheme();
  const loading = dashboardQuery.isLoading;
  const isError = dashboardQuery.isError;

  const dashboard = React.useMemo(() => {
    const records = (dashboardQuery.data?.data ?? []) as unknown as PrincipalDashboard[];
    return records[0];
  }, [dashboardQuery.data]);

  const distributionByRange = dashboard?.distribution.byRange ?? [];
  const classSummaryRaw = dashboard?.distribution.byClass ?? [];
  const attendanceByClass = dashboard?.attendance.byClass ?? [];
  const attendanceAlerts = dashboard?.attendance.alerts ?? [];

  const [sortConfig, setSortConfig] = React.useState<{ orderBy: keyof ClassSummary; order: Order }>(
    () => ({ orderBy: "average", order: "desc" })
  );

  const sortedClassSummary = React.useMemo(() => {
    if (!classSummaryRaw.length) {
      return [] as ClassSummary[];
    }
    const rows = [...classSummaryRaw];
    rows.sort((a, b) => {
      const valueA = a[sortConfig.orderBy];
      const valueB = b[sortConfig.orderBy];
      if (valueA < valueB) return sortConfig.order === "asc" ? -1 : 1;
      if (valueA > valueB) return sortConfig.order === "asc" ? 1 : -1;
      return a.className.localeCompare(b.className);
    });
    return rows;
  }, [classSummaryRaw, sortConfig]);

  const handleSort = (property: keyof ClassSummary) => () => {
    setSortConfig((prev) =>
      prev.orderBy === property
        ? { orderBy: property, order: prev.order === "asc" ? "desc" : "asc" }
        : { orderBy: property, order: "desc" }
    );
  };

  const totalStudents = distributionByRange.reduce((sum, item) => sum + item.count, 0);

  const isEmptyState =
    !loading &&
    !isError &&
    (!dashboard ||
      (distributionByRange.length === 0 &&
        sortedClassSummary.length === 0 &&
        attendanceByClass.length === 0 &&
        attendanceAlerts.length === 0));

  return (
    <Stack spacing={4} sx={{ width: "100%" }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: -0.4 }} gutterBottom>
          Dashboard Akademik
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ikhtisar nilai, kehadiran, serta indikator risiko terbaru untuk tindakan cepat.
        </Typography>
      </Box>

      {isError ? (
        <Alert
          severity="error"
          action={
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => dashboardQuery.refetch()}
                aria-label="Coba lagi memuat dashboard"
              >
                Coba lagi
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={() => push("/grade-configs")}
                aria-label="Buka halaman pengaturan"
              >
                Buka Pengaturan
              </Button>
            </Stack>
          }
          sx={{ borderRadius: 3 }}
        >
          <AlertTitle>Gagal memuat dashboard</AlertTitle>
          Periksa koneksi atau coba ulang beberapa saat lagi.
        </Alert>
      ) : null}

      <Grid container spacing={3} columns={12}>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Rata-rata Nilai"
            value={dashboard ? dashboard.distribution.overallAverage.toFixed(1) : "0.0"}
            subtitle={`${(dashboard?.distribution.totalStudents ?? 0).toLocaleString("id-ID")} siswa dipantau`}
            icon={<BarChart3 aria-label="Ikon nilai" />}
            accentColor={themeTokens.accentBlue}
            loading={loading}
            onCta={() => list("grades")}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Kehadiran Rata-rata"
            value={dashboard ? percent(dashboard.attendance.overall) : percent(0)}
            subtitle="Seluruh kelas dan mapel"
            icon={<Users aria-label="Ikon kehadiran" />}
            accentColor={themeTokens.accentGreen}
            loading={loading}
            onCta={() => list("attendance")}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Perlu Remedial"
            value={(dashboard?.remedial?.length ?? 0).toLocaleString("id-ID")}
            subtitle="Siswa belum mencapai KKM"
            icon={<AlertTriangle aria-label="Ikon remedial" />}
            accentColor={themeTokens.accentOrange}
            loading={loading}
            onCta={() => list("grades")}
          />
        </Grid>
      </Grid>

      {isEmptyState ? <EmptyState /> : null}

      <Grid container spacing={3} columns={12}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 20 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Distribusi Nilai
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {totalStudents.toLocaleString("id-ID")} siswa
              </Typography>
            </Stack>
            {loading ? (
              <TableSkeleton rows={4} columns={2} />
            ) : distributionByRange.length === 0 ? (
              <EmptyState message={EMPTY_MESSAGE} />
            ) : (
              <TableContainer>
                <Table size="small" aria-label="Tabel distribusi nilai">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rentang Nilai</TableCell>
                      <TableCell>Jumlah Siswa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {distributionByRange.map((bucket) => (
                      <TableRow
                        key={bucket.range}
                        hover
                        tabIndex={0}
                        sx={{
                          "&:focus-visible": {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: -2,
                          },
                        }}
                      >
                        <TableCell>{bucket.range}</TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {bucket.count.toLocaleString("id-ID")}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={totalStudents === 0 ? 0 : (bucket.count / totalStudents) * 100}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor: theme.palette.primary.main,
                                  borderRadius: 3,
                                },
                              }}
                              aria-label={`Distribusi ${bucket.range}`}
                            />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 20 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Kelas vs Nilai
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Urutkan untuk melihat tren
              </Typography>
            </Stack>
            {loading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : sortedClassSummary.length === 0 ? (
              <EmptyState />
            ) : (
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table stickyHeader size="small" aria-label="Tabel kelas dan nilai">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Kelas</TableCell>
                      {(["average", "highest", "lowest"] as const).map((key) => (
                        <TableCell
                          key={key}
                          sortDirection={sortConfig.orderBy === key ? sortConfig.order : false}
                        >
                          <TableSortLabel
                            active={sortConfig.orderBy === key}
                            direction={sortConfig.orderBy === key ? sortConfig.order : "asc"}
                            onClick={handleSort(key)}
                          >
                            {key === "average"
                              ? "Rata-rata"
                              : key === "highest"
                                ? "Tertinggi"
                                : "Terendah"}
                          </TableSortLabel>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedClassSummary.map((row) => (
                      <TableRow
                        key={row.classId}
                        hover
                        tabIndex={0}
                        sx={{
                          transition: "background-color 0.2s ease",
                          cursor: "pointer",
                          "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                          "&:focus-visible": {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: -2,
                          },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{row.className}</TableCell>
                        <TableCell>
                          <Typography
                            sx={{ fontWeight: 600, color: scoreColor(row.average, theme.palette) }}
                          >
                            {row.average.toFixed(1)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{ fontWeight: 500, color: scoreColor(row.highest, theme.palette) }}
                          >
                            {row.highest.toFixed(0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{ fontWeight: 500, color: scoreColor(row.lowest, theme.palette) }}
                          >
                            {row.lowest.toFixed(0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 20 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ringkasan Kehadiran Kelas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dashboard ? percent(dashboard.attendance.overall) : percent(0)} rata-rata sekolah
          </Typography>
        </Stack>
        {loading ? (
          <TableSkeleton rows={5} columns={3} />
        ) : attendanceByClass.length === 0 ? (
          <EmptyState />
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Ringkasan kehadiran kelas">
              <TableHead>
                <TableRow>
                  <TableCell>Kelas</TableCell>
                  <TableCell>Persentase</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceByClass.map((row) => (
                  <TableRow
                    key={row.classId}
                    hover
                    tabIndex={0}
                    sx={{
                      "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                      "&:focus-visible": {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: -2,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{row.className}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{percent(row.percentage)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          row.percentage >= 95
                            ? "Stabil"
                            : row.percentage >= 90
                              ? "Perlu pantau"
                              : "Perlu tindakan"
                        }
                        color={
                          row.percentage >= 95
                            ? "success"
                            : row.percentage >= 90
                              ? "warning"
                              : "error"
                        }
                        variant={row.percentage >= 95 ? "outlined" : "filled"}
                        aria-label={`Status kehadiran ${row.className}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 20 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Alert Kehadiran
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Terakhir diperbarui:{" "}
            {dashboard?.updatedAt ? new Date(dashboard.updatedAt).toLocaleString("id-ID") : "-"}
          </Typography>
        </Stack>
        {loading ? (
          <TableSkeleton rows={4} columns={4} />
        ) : attendanceAlerts.length === 0 ? (
          <EmptyState message="Tidak ada lonjakan ketidakhadiran minggu ini." />
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Daftar alert kehadiran">
              <TableHead>
                <TableRow>
                  <TableCell>Kelas</TableCell>
                  <TableCell>Indikator</TableCell>
                  <TableCell>Kehadiran</TableCell>
                  <TableCell>Pekan</TableCell>
                  <TableCell>Tren</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendanceAlerts.map((alert) => (
                  <TableRow
                    key={`${alert.classId}-${alert.week}`}
                    hover
                    tabIndex={0}
                    sx={{
                      "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.08) },
                      "&:focus-visible": {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: -2,
                      },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{alert.className}</TableCell>
                    <TableCell>
                      <Chip
                        label="Lonjakan ketidakhadiran"
                        color="warning"
                        variant="filled"
                        size="small"
                        aria-label="Lonjakan ketidakhadiran"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
                        {percent(alert.percentage)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={alert.week} placement="top" arrow>
                        <Typography sx={{ fontWeight: 500 }}>
                          {formatWeekLabel(alert.week)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Box
                        sx={{ width: "100%", height: 46 }}
                        aria-label={`Tren kehadiran ${alert.className}`}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={(alert.trend ?? [alert.percentage]).map((value, index) => ({
                              index,
                              value,
                            }))}
                          >
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={theme.palette.warning.main}
                              strokeWidth={2}
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  );
};
