import { useGetTimestampForHeightQuery } from '@chia-network/api-react';
import { Trans } from '@lingui/macro';
import moment from 'moment';
import React from 'react';

export type HeightToTimestampProps = {
  height: number;
  fromNow?: boolean;
};

export default function HeightToTimestamp(props: HeightToTimestampProps) {
  const { height, fromNow } = props;
  const { data, isLoading } = useGetTimestampForHeightQuery({ height });

  if (isLoading) {
    return <Trans>Loading...</Trans>;
  }

  const value = data?.timestamp;

  if (!value) {
    return null;
  }

  if (fromNow) {
    return <>{moment(value * 1000).fromNow()}</>;
  }

  return <>{moment(value * 1000).format('LLL')}</>;
}
