import React from "react";
import { Box, Button, Paper, Skeleton, Stack, Typography, alpha, useTheme } from "@mui/material";

export type SummaryCardProps = {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon: React.ReactElement;
  accentColor: string;
  loading?: boolean;
  ctaLabel?: string;
  onCta?: () => void;
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  loading,
  ctaLabel = "Lihat detail",
  onCta,
}) => {
  const theme = useTheme();
  const iconElement = React.cloneElement(icon, {
    size: 22,
    color: accentColor,
    "aria-hidden": "true",
    focusable: "false",
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        borderRadius: 20,
        position: "relative",
        overflow: "hidden",
      }}
      role="group"
      aria-busy={loading ? "true" : undefined}
    >
      <Stack spacing={2} alignItems="flex-start">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(accentColor, theme.palette.mode === "dark" ? 0.18 : 0.12),
          }}
          aria-label={`Ikon ${title}`}
        >
          {iconElement}
        </Box>

        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={120} height={36} />
          ) : (
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: -0.3 }}>
              {value}
            </Typography>
          )}
        </Box>

        {subtitle ? (
          loading ? (
            <Skeleton variant="text" width={180} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )
        ) : null}

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="text"
          color="primary"
          onClick={onCta}
          disabled={!onCta}
          aria-label={`${ctaLabel} untuk ${title}`}
          sx={{ fontWeight: 600, alignSelf: "flex-start", px: 0 }}
        >
          {ctaLabel}
        </Button>
      </Stack>
    </Paper>
  );
};
