import { alpha, Button as BaseButton, ButtonProps as BaseButtonProps } from '@mui/material';
import React, { SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import Color from '../../constants/Color';

const StyledBaseButton = styled(({ nowrap: boolean, selected, ...rest }) => <BaseButton {...rest} />)`
  white-space: ${({ nowrap }) => (nowrap ? 'nowrap' : 'normal')};
  ${({ selected, theme }) => {
    if (!selected) {
      return '';
    }

    const isDark = theme.palette.mode === 'dark';
    const level = isDark ? '50' : '900';

    return `
      background-color: ${alpha(Color.Neutral[level], 0.1)};
      border-color: ${alpha(Color.Neutral[level], 0.3)} !important;
    `;
  }}
`;

function getColor(theme, variant) {
  switch (variant) {
    case 'contained':
      return theme.palette.danger.contrastText;
    default:
      return theme.palette.danger.main;
  }
}

const DangerButton = styled(StyledBaseButton)`
  color: ${({ theme, variant }) => getColor(theme, variant)};
  ${({ theme, variant }) => (variant === 'contained' ? `background-color: ${theme.palette.danger.main};` : undefined)}

  &:hover {
    color: ${({ theme, variant }) => getColor(theme, variant)};
    ${({ theme, variant }) => (variant === 'contained' ? `background-color: ${theme.palette.danger.main};` : undefined)}
  }
`;

export type ButtonProps = Omit<BaseButtonProps, 'color'> & {
  color?: BaseButtonProps['color'] | 'danger';
  to?: string | Object;
  nowrap?: boolean;
  selected?: boolean;
};

export default function Button(props: ButtonProps) {
  const { color = 'secondary', to, onClick, disableElevation = true, ...rest } = props;

  const navigate = useNavigate();

  const handleClick = React.useCallback(
    (...args: any[]) => {
      if (to) {
        navigate(to);
      }

      if (onClick) {
        onClick(...args);
      }
    },
    [to, navigate, onClick],
  );

  const onAuxClick = React.useMemo(() => {
    if (!rest.href) {
      return undefined;
    }
    return (event: SyntheticEvent, ...restArgs: any[]) => {
      event.preventDefault();
      handleClick(...restArgs);
    };
  }, [rest.href, handleClick]);

  switch (color) {
    case 'danger':
      return (
        <DangerButton {...rest} onClick={handleClick} onAuxClick={onAuxClick} disableElevation={disableElevation} />
      );
    case 'primary':
      return (
        <StyledBaseButton
          {...rest}
          onClick={handleClick}
          onAuxClick={onAuxClick}
          disableElevation={disableElevation}
          color="primary"
        />
      );
    case 'secondary':
      return (
        <StyledBaseButton
          {...rest}
          onClick={handleClick}
          onAuxClick={onAuxClick}
          disableElevation={disableElevation}
          color="secondary"
        />
      );
    default:
      return (
        <StyledBaseButton {...rest} onClick={handleClick} onAuxClick={onAuxClick} disableElevation={disableElevation} />
      );
  }
}
