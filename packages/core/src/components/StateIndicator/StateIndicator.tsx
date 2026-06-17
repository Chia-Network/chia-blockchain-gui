import { useTheme } from '@mui/material/styles';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

import State from '../../constants/State';
import StateColor from '../../constants/StateColor';
import { getSemanticColors } from '../../theme/semanticColors';
import Flex from '../Flex';

import StateIndicatorDot from './StateIndicatorDot';

const StyledFlexContainer = styled(({ ...rest }) => <Flex {...rest} />)`
  gap: 4px;
`;

function useStateColor(state: State): string {
  const theme = useTheme();
  const semanticColors = getSemanticColors(theme.palette);

  switch (state) {
    case State.SUCCESS:
      return semanticColors.success;
    case State.WARNING:
      return semanticColors.warning;
    case State.ERROR:
      return semanticColors.error;
    default:
      break;
  }

  const Color = {
    [State.SUCCESS]: StateColor.SUCCESS,
    [State.WARNING]: StateColor.WARNING,
    [State.ERROR]: StateColor.ERROR,
  };

  return Color[state];
}

export type StateComponentProps = {
  children?: ReactNode;
  state: State;
  indicator?: boolean;
  reversed?: boolean;
  color?: string;
  gap?: number;
  hideTitle?: boolean;
};

export default function StateComponent(props: StateComponentProps) {
  const { children, state, indicator = false, reversed = false, color: colorProp, gap = 1, hideTitle = false } = props;

  const themeColor = useStateColor(state);
  const color = colorProp ?? themeColor;

  return (
    <StyledFlexContainer color={color} alignItems="center" gap={gap} flexDirection={reversed ? 'row-reverse' : 'row'}>
      {!hideTitle && <span>{children}</span>}
      {indicator && <StateIndicatorDot color={color} state={state} />}
    </StyledFlexContainer>
  );
}
