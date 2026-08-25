import { ConnectCheckmark, ConnectCancel, ConnectReload } from '@chia-network/icons';
import React from 'react';
import styled from 'styled-components';

import State from '../../constants/State';

const WrapperStyled = styled.div<{ $color?: string }>`
  display: inline-block;
  font-size: 1rem;
  position: relative;

  ${({ $color }) =>
    $color
      ? `
    .checkmark-icon g circle,
    .checkmark-icon g path,
    .reload-icon g circle,
    .reload-icon g path,
    .cancel-icon g circle,
    .cancel-icon g path {
      stroke: ${$color};
      fill: ${$color};
    }
  `
      : ''}
`;

type StateIndicatorDotTypes = {
  state: string;
  color?: string;
};

export default function StateIndicatorDot(props: StateIndicatorDotTypes) {
  const { state, color } = props;
  function renderIcon() {
    if (state === State.SUCCESS) {
      return <ConnectCheckmark className="checkmark-icon" sx={{ width: '21px', height: '21px' }} />;
    }
    if (state === State.WARNING) {
      return <ConnectReload className="reload-icon" sx={{ width: '21px', height: '21px' }} />;
    }
    if (state === State.ERROR) {
      return <ConnectCancel className="cancel-icon" sx={{ width: '21px', height: '21px' }} />;
    }
    return null;
  }
  return <WrapperStyled $color={color}>{renderIcon()}</WrapperStyled>;
}
