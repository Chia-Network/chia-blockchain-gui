import { alpha } from '@mui/material';
import { SparkLineChart } from '@mui/x-charts';
import { areaElementClasses } from '@mui/x-charts/LineChart';
import BigNumber from 'bignumber.js';
import JSONbig from 'json-bigint';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import Color from '../../constants/Color';

const StyledGraphContainer = styled.div<{ height: number }>`
  position: relative;
  min-height: 80px;
  height: ${({ height }) => `${height}px`};
`;

function LinearGradient() {
  return (
    <defs>
      <linearGradient id="graph-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={alpha(Color.Green[500], 0.4)} />
        <stop offset="100%" stopColor={alpha(Color.Green[500], 0)} />
      </linearGradient>
    </defs>
  );
}

const sx = {
  [`& .${areaElementClasses.root}`]: {
    fill: 'url(#graph-gradient)',
  },
};

type Point = {
  x: number;
  y: number | BigNumber;
};

export type LineChartProps = {
  data: Point[];
  // min?: number;
  height?: number;
  xValueFormatter?: (value: number) => string;
  yValueFormatter?: (value: number | BigNumber | null) => string;
};

export default function LineChart(props: LineChartProps) {
  const {
    data,
    // min: defaultMin = 0,
    xValueFormatter = (value) => value.toString(),
    yValueFormatter = (value) => (value !== null ? value.toString() : ''),
    height = 150,
  } = props;

  const stringifiedData = useMemo(() => JSONbig.stringify(data), [data]);

  const freezedData = useMemo<Point[]>(() => JSONbig.parse(stringifiedData), [stringifiedData]);

  const yData = useMemo(() => freezedData.map((item) => item.y), [freezedData]);
  const xData = useMemo(() => freezedData.map((item) => item.x), [freezedData]);

  const yDataNumber = yData.map((value) => (value instanceof BigNumber ? value.toNumber() : value));

  // const min = data.length ? Math.min(...yDataNumber) : defaultMin;
  // const max = Math.max(min, ...yDataNumber);

  const xAxis = useMemo(
    () => ({
      data: xData,
      valueFormatter: xValueFormatter,
    }),
    [xData, xValueFormatter],
  );

  /*
  const yAxis = useMemo(
    () => ({
      min,
      max,
    }),
    [min, max],
  );
  */

  return (
    <StyledGraphContainer height={height}>
      <SparkLineChart
        xAxis={xAxis}
        data={yDataNumber}
        height={height || 0}
        valueFormatter={yValueFormatter}
        curve="monotoneX"
        margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
        colors={[Color.Green[500]]}
        area
        showHighlight
        showTooltip
        sx={sx}
      >
        <LinearGradient />
        <rect x={0} y={0} width={0} height="100%" fill="url(#graph-gradient)" />
      </SparkLineChart>
    </StyledGraphContainer>
  );
}
