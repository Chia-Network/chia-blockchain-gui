import { alpha, Box, Card, CardContent, CardActionArea } from '@mui/material';
import React, { type ReactNode } from 'react';

import Color from '../../constants/Color';
import getColorModeValue from '../../utils/useColorModeValue';
import Loading from '../Loading';

export type CardListItemProps = {
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  loading?: boolean;
  noPadding: boolean;
  borderTransparency?: boolean;
};

export default function CardListItem(props: CardListItemProps) {
  const { children, selected, onSelect, loading, disabled, noPadding = false, borderTransparency, ...rest } = props;

  const content = (
    <CardContent sx={{ padding: (theme) => (noPadding ? `0px !important` : `${theme.spacing(2)}`) }}>
      {children}
    </CardContent>
  );

  return (
    <Card
      variant="outlined"
      {...rest}
      sx={{
        width: '100%',
        borderRadius: (theme) => `${theme.spacing(1)}`,
        border: (theme) =>
          `1px solid ${
            selected
              ? theme.palette.highlight.main
              : borderTransparency
                ? theme.palette.background.default
                : getColorModeValue(theme, 'border')
          }`,
        backgroundColor: (theme) =>
          `${selected ? getColorModeValue(theme, 'sidebarBackground') : theme.palette.background.paper}`,
        position: 'relative',
        overflow: 'visible',
        transition: 'background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',

        '&:hover': {
          borderColor: (theme) =>
            `${disabled ? theme.palette.divider : selected ? theme.palette.highlight.main : theme.palette.divider}`,
          backgroundColor: (theme) =>
            disabled
              ? undefined
              : selected
                ? getColorModeValue(theme, 'sidebarBackground')
                : theme.palette.mode === 'dark'
                  ? alpha('#d8ad45', 0.1)
                  : alpha('#b98524', 0.08),
          boxShadow: (theme) =>
            disabled || !onSelect
              ? undefined
              : theme.palette.mode === 'dark'
                ? '0 4px 14px rgba(0, 0, 0, 0.22)'
                : '0 4px 14px rgba(71, 58, 36, 0.14)',
          transform: disabled || !onSelect ? undefined : 'translateY(-1px)',
        },
      }}
    >
      {onSelect ? <CardActionArea onClick={onSelect}>{content}</CardActionArea> : content}
      {(loading || disabled) && (
        <Box
          position="absolute"
          left={0}
          top={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor={disabled ? alpha(Color.Neutral[900], 0.2) : 'transparent'}
          zIndex={1}
        >
          {loading && <Loading center />}
        </Box>
      )}
    </Card>
  );
}
