import { ConnectCheckmark, ConnectCancel, ConnectReload } from '@chia-network/icons';
import React from 'react';
import styled from 'styled-components';

import State from '../../constants/State';

const WrapperStyled = styled.div`
  display: inline-block;
  font-size: 1rem;
  position: relative;
`;

type StateIndicatorDotTypes = {
  color?: string;
  state: string;
};

export default function StateIndicatorDot(props: StateIndicatorDotTypes) {
  const { color, state } = props;
  function renderIcon() {
    const sx = { width: '21px', height: '21px', color };

    if (state === State.SUCCESS) {
      return <ConnectCheckmark className="checkmark-icon" sx={sx} />;
    }
    if (state === State.WARNING) {
      return <ConnectReload className="reload-icon" sx={sx} />;
    }
    if (state === State.ERROR) {
      return <ConnectCancel className="cancel-icon" sx={sx} />;
    }
    return null;
  }
  return <WrapperStyled>{renderIcon()}</WrapperStyled>;
}
