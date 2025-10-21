import React from "react";
import { Stack, useMediaQuery, useTheme } from "@mui/material";

export type ResponsiveListProps<TRecord = any> = {
  datagrid: React.ReactNode;
  mobilerender: (record: TRecord, index: number) => React.ReactNode;
  records?: TRecord[];
};

export function ResponsiveList<TRecord = any>({
  datagrid,
  mobilerender,
  records = [],
}: ResponsiveListProps<TRecord>) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  if (isMdUp) {
    return <>{datagrid}</>;
  }

  return (
    <Stack gap={1.5}>
      {records.map((record, index) => (
        <React.Fragment key={(record as any)?.id ?? index}>
          {mobilerender(record, index)}
        </React.Fragment>
      ))}
    </Stack>
  );
}
