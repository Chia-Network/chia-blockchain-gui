import { FarmingInfoWithIndex } from '@chia-network/api';
import { useGetFarmingInfoQuery } from '@chia-network/api-react';
import { CardSimple, Flex, useDarkMode } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import * as React from 'react';
import { useMeasure } from 'react-use';
import styled from 'styled-components';
import { VictoryChart, VictoryArea, VictoryAxis, VictoryZoomContainer, VictoryScatter } from 'victory';

const StyledGraphContainer = styled.div`
  position: relative;
  min-height: 80px;
  height: ${(props: { height: unknown }) => (typeof props.height === 'string' ? props.height : `${props.height}px`)};
`;

const StyledPoint = styled.circle`
  fill: ${(props: { isDarkMode: boolean }) => (props.isDarkMode ? '#efefef' : '#333')};
`;

type ScatterPointProps = { x: number; y: number; isDarkMode: boolean };
function ScatterPoint(props: ScatterPointProps) {
  return <StyledPoint cx={props.x} cy={props.y} r={4} isDarkMode={props.isDarkMode} />;
}

function prepareGraphPoints(farmingInfo: FarmingInfoWithIndex[]) {
  if (!farmingInfo.length) {
    return [];
  }

  const points: { x: number; y: number }[] = [];

  farmingInfo.forEach((item, i) => {
    const { time } = item;

    points.unshift({
      x: farmingInfo.length - i - 1,
      y: time.toNumber() * 1000,
    });
  });

  return points;
}

const domainPadding = { x: 0, y: 1 };
const chartPadding = { left: 64, bottom: 24, top: 24, right: 24 };

export type HarvesterLatencyGraphProps = {
  height?: number | string;
  n?: number;
};

export default function HarvesterLatencyGraph(props: HarvesterLatencyGraphProps) {
  const { height = 400, n = 24 } = props;
  const { isDarkMode } = useDarkMode();
  const { data: farmingInfo, isLoading } = useGetFarmingInfoQuery();
  const [ref, containerSize] = useMeasure();
  const data = React.useMemo(() => {
    if (!farmingInfo) {
      return [];
    }
    return prepareGraphPoints(farmingInfo.slice(0, n));
  }, [farmingInfo, n]);

  const yMin = React.useMemo(() => (data.length ? Math.min(...data.map((item) => item.y)) : 0), [data]);
  const yMax = React.useMemo(() => Math.max(yMin, ...data.map((item) => item.y)) * 1.1, [yMin, data]);
  const latestFarmingInfo = React.useMemo(() => {
    if (!farmingInfo || farmingInfo.length === 0) {
      return { time: NaN, totalPlots: NaN };
    }
    return { time: farmingInfo[0].time.toNumber() * 1000, totalPlots: farmingInfo[0].totalPlots };
  }, [farmingInfo]);
  const cardTitle = React.useMemo(() => <Trans>Harvester Latency</Trans>, []);
  const cardValue = React.useMemo(
    () =>
      `Total Plots: ${latestFarmingInfo.totalPlots}` +
      ` / Min: ${yMin.toFixed(1)} ms` +
      ` / Max: ${yMax.toFixed(1)} ms` +
      ` / Latest: ${latestFarmingInfo.time.toFixed(1)} ms`,
    [yMin, yMax, latestFarmingInfo]
  );
  const zoomContainer = React.useMemo(() => <VictoryZoomContainer zoomDimension="y" />, []);
  const chartDomain = React.useMemo(
    () => ({
      x: [-1, n] as [number, number],
      y: [0, yMax] as [number, number],
    }),
    [yMax, n]
  );
  const areaStyle = React.useMemo(
    () => ({
      data: {
        stroke: '#5DAA62',
        strokeWidth: 2,
        strokeLinecap: 'round',
        fill: 'url(#graph-gradient)',
      },
      labels: {
        fontSize: 12,
        fill: isDarkMode ? '#efefef' : '#333',
      },
    }),
    [isDarkMode]
  );
  const yAxis = React.useMemo(
    () => (
      <VictoryAxis
        dependentAxis
        label="Harvester Latency (ms)"
        width={100}
        axisValue={-1}
        style={{
          axisLabel: {
            padding: 48,
            fill: isDarkMode ? '#efefef' : '#333',
          },
          tickLabels: {
            fill: isDarkMode ? '#efefef' : '#333',
          },
          axis: { stroke: isDarkMode ? '#ccc' : '#333' },
        }}
      />
    ),
    [isDarkMode]
  );
  const xAxis = React.useMemo(
    () => (
      <VictoryAxis
        tickFormat={() => ''}
        style={{
          axis: { stroke: isDarkMode ? '#ccc' : '#333' },
        }}
      />
    ),
    [isDarkMode]
  );
  const chart = React.useMemo(() => {
    if (data.length < 2) {
      return null;
    }
    return (
      <VictoryChart
        width={containerSize.width || 1}
        height={containerSize.height || 1}
        domain={chartDomain}
        padding={chartPadding}
        domainPadding={domainPadding}
        containerComponent={zoomContainer}
      >
        <VictoryArea
          data={data}
          interpolation="linear"
          style={areaStyle}
          labels={({ datum }) => `${datum.y.toFixed(1)}`}
        />
        <VictoryScatter data={data} dataComponent={<ScatterPoint isDarkMode={isDarkMode} />} />
        {xAxis}
        {yAxis}
      </VictoryChart>
    );
  }, [data, containerSize, chartDomain, zoomContainer, xAxis, yAxis, isDarkMode, areaStyle]);

  return (
    <CardSimple loading={isLoading || data.length < 2} title={cardTitle} value={cardValue}>
      <Flex flexGrow={1} />
      <StyledGraphContainer height={height} ref={ref as React.Ref<HTMLDivElement>}>
        {chart}
      </StyledGraphContainer>
    </CardSimple>
  );
}
