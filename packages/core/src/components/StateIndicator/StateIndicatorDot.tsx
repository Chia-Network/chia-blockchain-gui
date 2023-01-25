import { ConnectCheckmark, ConnectCancel, ConnectReload } from '@chia-network/icons';
import React from 'react';
import styled from 'styled-components';

import State from '../../constants/State';

const WrapperStyled = styled.div`
  display: inline-block;
  width: 18px;
  height: 18px;
  font-size: 1rem;
  border: 2px solid ${({ color }) => color};
  border-radius: 50%;
`;

type StateIndicatorDotTypes = {
  color: string;
  state: string;
};

export default function StateIndicatorDot(props: StateIndicatorDotTypes) {
  const { color, state } = props;
  function renderIcon() {
    if (state === State.SUCCESS) {
      return <ConnectCheckmark />;
    }
    if (state === State.WARNING) {
      return <ConnectReload />;
    }
    if (state === State.ERROR) {
      return <ConnectCancel />;
    }
    return null;
  }
  return <WrapperStyled color={color}>{renderIcon()}</WrapperStyled>;
}
