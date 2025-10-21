import React from "react";
import { Box, Paper, Stack } from "@mui/material";

type StickyActionBarProps = {
  children: React.ReactNode;
};

export const StickyActionBar: React.FC<StickyActionBarProps> = ({ children }) => (
  <Box
    sx={{
      position: { xs: "sticky", md: "static" },
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: (theme) => theme.zIndex.appBar,
      mt: { xs: 2, md: 3 },
    }}
  >
    <Paper
      elevation={3}
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: { xs: 0, md: 2 },
        boxShadow: { xs: "0 -4px 18px rgba(15, 23, 42, 0.12)", md: "none" },
      }}
    >
      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
        {children}
      </Stack>
    </Paper>
  </Box>
);
