import { Box, Card, CardContent, CardActionArea } from '@mui/material';
import React, { type ReactNode } from 'react';

import getColorModeValue from '../../utils/useColorModeValue';
import Loading from '../Loading';

export type CardListItemProps = {
  children: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  loading?: boolean;
  noPadding: boolean;
};

export default function CardListItem(props: CardListItemProps) {
  const { children, selected, onSelect, loading, disabled, noPadding = false, ...rest } = props;

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
        border: (theme) => `1px solid ${selected ? theme.palette.highlight.main : theme.palette.divider}`,
        backgroundColor: (theme) =>
          `${selected ? getColorModeValue(theme, 'sidebarBackground') : theme.palette.background.paper}`,
        position: 'relative',
        overflow: 'visible',

        '&:hover': {
          borderColor: (theme) =>
            `${disabled ? theme.palette.divider : selected ? theme.palette.highlight.main : theme.palette.divider}`,
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
          bgcolor={disabled ? 'rgba(0, 0, 0, 0.2)' : 'transparent'}
          zIndex={1}
        >
          {loading && <Loading center />}
        </Box>
      )}
    </Card>
  );
}
