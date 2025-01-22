import { Card } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';

import LogViewer from './LogViewer';

export default function LogViewerCard() {
  const theme = useTheme();

  return (
    <Card sx={{ backgroundColor: theme.palette.background.paper }}>
      <LogViewer pageSize={1000} />
    </Card>
  );
}
