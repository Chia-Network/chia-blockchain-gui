import { Color, Flex } from '@chia-network/core';
import { Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { ReactNode } from 'react';

export type OfferBuilderHeaderProps = {
  icon: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
};

export default function OfferBuilderHeader(props: OfferBuilderHeaderProps) {
  const { icon, title, subtitle } = props;
  const theme = useTheme();

  return (
    <Flex
      gap={2}
      sx={{
        borderRadius: 2,
        backgroundColor: theme.palette.mode === 'light' ? Color.Neutral[200] : Color.Neutral[800],
        border: '1px solid',
        borderColor: `${theme.palette.border.main}`,
        paddingY: 2,
        paddingX: 3,
      }}
    >
      <Flex
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        sx={{
          backgroundColor: 'background.card',
          width: '72px',
          height: '72px',
          borderRadius: 9999,
        }}
      >
        {icon}
      </Flex>
      <Flex flexDirection="column" justifyContent="center" minWidth={0}>
        <Typography variant="h6" fontWeight="500">
          {title}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      </Flex>
    </Flex>
  );
}
