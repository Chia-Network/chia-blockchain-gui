import React, { ReactNode } from 'react';
import styled from 'styled-components';

import State from '../../constants/State';
import StateColor from '../../constants/StateColor';
import Flex from '../Flex';
import StateIndicatorDot from './StateIndicatorDot';

const Color = {
  [State.SUCCESS]: StateColor.SUCCESS,
  [State.WARNING]: StateColor.WARNING,
  [State.ERROR]: StateColor.ERROR,
};

const StyledFlexContainer = styled(({ ...rest }) => <Flex {...rest} />)`
  position: relative;
  top: -1px;
`;

export type StateComponentProps = {
  children: ReactNode;
  state: State;
  indicator?: boolean;
  reversed?: boolean;
  color?: string;
  gap?: number;
  hideTitle?: boolean;
};

export default function StateComponent(props: StateComponentProps) {
  const {
    children,
    state,
    indicator = false,
    reversed = false,
    color = Color[state],
    gap = 1,
    hideTitle = false,
  } = props;

  return (
    <StyledFlexContainer color={color} alignItems="center" gap={gap} flexDirection={reversed ? 'row-reverse' : 'row'}>
      {!hideTitle && <span>{children}</span>}
      {indicator && <StateIndicatorDot state={state} />}
    </StyledFlexContainer>
  );
}
