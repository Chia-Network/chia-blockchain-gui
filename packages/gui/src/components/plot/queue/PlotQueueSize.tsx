import React from 'react';
import { getPlotSize } from '../../../constants/plotSizes';
import type PlotQueueItem from '../../../types/PlotQueueItem';

type Props = {
  queueItem: PlotQueueItem;
};

export default function PlotQueueSize(props: Props) {
  const {
    queueItem: { size },
  } = props;
  const item = getPlotSize(size as 25|32|33|34|35);
  if (!item) {
    return null;
  }

  return <>{`K-${size}, ${item}`}</>;
}
