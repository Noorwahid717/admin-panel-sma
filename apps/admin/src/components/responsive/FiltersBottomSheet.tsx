import React from "react";
import { Box, Button, Divider, Drawer, Stack, Typography, useTheme } from "@mui/material";
import { X } from "lucide-react";

export type FiltersBottomSheetProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onReset?: () => void;
  onApply?: () => void;
  children?: React.ReactNode;
};

export const FiltersBottomSheet: React.FC<FiltersBottomSheetProps> = ({
  open,
  title = "Filter",
  onClose,
  onReset,
  onApply,
  children,
}) => {
  const theme = useTheme();

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          pb: 2,
          backgroundColor: theme.palette.background.paper,
        },
      }}
      ModalProps={{ keepMounted: true }}
    >
      <Stack spacing={2} sx={{ px: 3, pt: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          <Button
            onClick={onClose}
            startIcon={<X size={18} aria-hidden="true" focusable="false" />}
            variant="text"
            sx={{ color: theme.palette.text.secondary }}
          >
            Tutup
          </Button>
        </Stack>
        <Divider />
        <Box sx={{ maxHeight: "60vh", overflowY: "auto", pr: 1 }}>{children}</Box>
        <Stack spacing={1.5}>
          <Divider />
          <Stack direction="row" spacing={1.5}>
            <Button fullWidth variant="outlined" onClick={onReset} disabled={!onReset}>
              Reset
            </Button>
            <Button fullWidth variant="contained" onClick={onApply}>
              Terapkan
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
};
