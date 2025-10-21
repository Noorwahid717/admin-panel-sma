import React from "react";
import { Box, Chip, IconButton, Paper, Stack, Typography, useTheme } from "@mui/material";
import { MoreVertical, Pencil, Eye } from "lucide-react";

export type MobileCardListRecord = Record<string, unknown> & { id?: React.Key };

type MobileCardListProps<TRecord extends MobileCardListRecord> = {
  records?: TRecord[];
  getKey?: (record: TRecord, index: number) => React.Key;
  primary: (record: TRecord) => React.ReactNode;
  secondary?: (record: TRecord) => React.ReactNode;
  tertiary?: (record: TRecord) => React.ReactNode;
  meta?: (record: TRecord) => React.ReactNode;
  statusChip?: (
    record: TRecord
  ) => { label: string; color?: "default" | "success" | "warning" | "error" } | null;
  onEdit?: (record: TRecord) => void;
  onShow?: (record: TRecord) => void;
  actions?: (record: TRecord) => React.ReactNode;
  emptyMessage?: string;
};

export const MobileCardList = <TRecord extends MobileCardListRecord>({
  records = [],
  getKey,
  primary,
  secondary,
  tertiary,
  meta,
  statusChip,
  onEdit,
  onShow,
  actions,
  emptyMessage = "Belum ada data",
}: MobileCardListProps<TRecord>) => {
  const theme = useTheme();

  if (!records?.length) {
    return (
      <Paper
        elevation={0}
        sx={{
          px: 3,
          py: 6,
          textAlign: "center",
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(148, 163, 184, 0.08)"
              : "rgba(148, 163, 184, 0.12)",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack gap={1.5} component="ul" sx={{ listStyle: "none", px: 0, m: 0 }}>
      {records.map((record, index) => {
        const key = getKey ? getKey(record, index) : (record.id ?? index);
        const resolvedStatus = statusChip?.(record);
        return (
          <Paper
            component="li"
            key={key}
            elevation={0}
            sx={{
              borderRadius: 3,
              px: 2.5,
              py: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ fontSize: "clamp(15px, 3vw, 18px)", fontWeight: 600 }}
                >
                  {primary(record)}
                </Typography>
                {secondary ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {secondary(record)}
                  </Typography>
                ) : null}
              </Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                {resolvedStatus ? (
                  <Chip
                    label={resolvedStatus.label}
                    color={resolvedStatus.color ?? "default"}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  />
                ) : null}
                {actions ? actions(record) : null}
              </Stack>
            </Stack>

            {tertiary ? (
              <Typography variant="body2" color="text.secondary">
                {tertiary(record)}
              </Typography>
            ) : null}

            {meta ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 1,
                  pt: 0.5,
                }}
              >
                {meta(record)}
              </Box>
            ) : null}

            {(onEdit || onShow) && !actions ? (
              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                {onShow ? (
                  <IconButton
                    aria-label="Lihat detail"
                    size="small"
                    onClick={() => onShow(record)}
                    sx={{ borderRadius: 2 }}
                  >
                    <Eye size={18} />
                  </IconButton>
                ) : null}
                {onEdit ? (
                  <IconButton
                    aria-label="Ubah"
                    size="small"
                    onClick={() => onEdit(record)}
                    sx={{ borderRadius: 2 }}
                  >
                    <Pencil size={18} />
                  </IconButton>
                ) : null}
                {actions ? (
                  <IconButton aria-label="Aksi lainnya" size="small" sx={{ borderRadius: 2 }}>
                    <MoreVertical size={18} />
                  </IconButton>
                ) : null}
              </Stack>
            ) : null}
          </Paper>
        );
      })}
    </Stack>
  );
};
