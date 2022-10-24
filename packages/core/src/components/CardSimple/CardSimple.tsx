import React, { type ReactNode, ReactElement } from 'react';
import { Trans } from '@lingui/macro';
import Flex from '../Flex';
import TooltipIcon from '../TooltipIcon';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TypographyProps,
  CircularProgress,
} from '@mui/material';

export type CardSimpleProps = {
  title: ReactNode;
  actions?: ReactNode;
  value?: ReactNode;
  valueColor?: TypographyProps['color'];
  description?: ReactNode;
  loading?: boolean;
  tooltip?: ReactElement<any>;
  error?: Error;
  children?: ReactNode;
};

export default function CardSimple(props: CardSimpleProps) {
  const {
    title,
    value,
    description,
    valueColor = 'primary',
    loading = false,
    tooltip,
    error,
    actions,
    children,
  } = props;

  return (
    <Card sx={{ height: '100%', overflow: 'visible' }}>
      <CardContent
        sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <Box marginBottom={0.5}>
          <Flex
            flexGrow={1}
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={0.5}
          >
            <Flex gap={1} alignItems="center">
              <Typography color="textSecondary">{title}</Typography>
              {tooltip && <TooltipIcon>{tooltip}</TooltipIcon>}
            </Flex>
            {actions}
          </Flex>
        </Box>
        {loading ? (
          <Box>
            <CircularProgress color="secondary" size={25} />
          </Box>
        ) : error ? (
          <Flex alignItems="center">
            <Typography variant="h5" color="error" fontSize="1.25rem">
              <Trans>Error</Trans>
            </Typography>
            &nbsp;
            <TooltipIcon>{error?.message}</TooltipIcon>
          </Flex>
        ) : (
          <Typography
            variant="h5"
            color={valueColor}
            sx={{ wordWrap: 'break-word', fontSize: '1.25rem' }}
          >
            {value}
          </Typography>
        )}
        {description && (
          <Typography variant="caption" color="textSecondary" flexGrow={1}>
            {description}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
