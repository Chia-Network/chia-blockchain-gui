import { ConnectCheckmark, ConnectCancel, ConnectReload } from '@chia-network/icons';
import React from 'react';
import styled from 'styled-components';

import State from '../../constants/State';

const WrapperStyled = styled.div`
  display: inline-block;
  font-size: 1rem;
  position: relative;
  top: 1px;
`;

type StateIndicatorDotTypes = {
  state: string;
};

export default function StateIndicatorDot(props: StateIndicatorDotTypes) {
  const { state } = props;
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
  return <WrapperStyled>{renderIcon()}</WrapperStyled>;
}
