import { Typography } from '@mui/material';
import React from 'react';
import styled from 'styled-components';

import State from '../../constants/State';
import { getStateColors } from '../../theme/semanticColors';

const StateKey = {
  [State.SUCCESS]: 'success',
  [State.WARNING]: 'warning',
  [State.ERROR]: 'error',
} as const;

export default styled(({ state, ...rest }) => <Typography {...rest} />)`
  ${({ state, theme }) => (state ? `color: ${getStateColors(theme.palette)[StateKey[state as State]]};` : '')}
`;
