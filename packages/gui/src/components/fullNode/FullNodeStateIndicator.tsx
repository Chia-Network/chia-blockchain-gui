import { Loading, State, StateIndicator } from '@chia/core';
import React from 'react';

import FullNodeState from '../../constants/FullNodeState';
import useFullNodeState from '../../hooks/useFullNodeState';

export type FullNodeStateIndicatorProps = {
  color?: string;
};

export default function FullNodeStateIndicator(props: FullNodeStateIndicatorProps) {
  const { color } = props;
  const { state, isLoading } = useFullNodeState();

  if (isLoading) {
    return <Loading size={14} />;
  }

  if (state === FullNodeState.ERROR) {
    return <StateIndicator state={State.ERROR} color={color} indicator hideTitle />;
  }
  if (state === FullNodeState.SYNCED) {
    return <StateIndicator state={State.SUCCESS} color={color} indicator hideTitle />;
  }
  if (state === FullNodeState.SYNCHING) {
    return <StateIndicator state={State.WARNING} color={color} indicator hideTitle />;
  }

  return null;
}
