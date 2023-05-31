import { Box } from '@mui/material';
import moment from 'moment';
import React, { type ReactNode } from 'react';

export type HumanTimestampProps = {
  value: number;
  fromNow?: boolean;
  notAvailable?: ReactNode;
};

export default function HumanTimestamp(props: HumanTimestampProps) {
  const { value, fromNow, notAvailable = null } = props;

  if (!value) {
    return <>{notAvailable}</>;
  }

  return (
    <Box sx={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
      {fromNow ? moment(value * 1000).fromNow(true) : moment(value * 1000).format('LLL')}
    </Box>
  );
}
