import moment from 'moment';
import React, { type ReactNode } from 'react';

export type HumanTimestampProps = {
  value: number;
  fromNow?: boolean;
  notAvailable?: ReactNode;
};

export default function HumanTimestamp(props: HumanTimestampProps) {
  const { value, fromNow, notAvailable = null } = props;

  if (!value) {
    return <>{notAvailable}</>;
  }

  if (fromNow) {
    return <>{moment(value * 1000).fromNow()}</>;
  }

  return <>{moment(value * 1000).format('LLL')}</>;
}
