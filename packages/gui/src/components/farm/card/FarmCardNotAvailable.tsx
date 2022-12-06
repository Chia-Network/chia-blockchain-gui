import { State, StateIndicator, CardSimple } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React, { type ReactNode } from 'react';

type Props = {
  title: ReactNode;
  state?: State;
};

export default function FarmCardNotAvailable(props: Props) {
  const { title, state } = props;

  return (
    <CardSimple
      title={title}
      value={
        state ? (
          <StateIndicator state={state}>
            <Trans>Not Available</Trans>
          </StateIndicator>
        ) : (
          <Trans>Not Available</Trans>
        )
      }
      description={<Trans>Wait for synchronization</Trans>}
      valueColor="initial"
    />
  );
}
