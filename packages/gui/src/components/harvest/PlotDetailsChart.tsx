import { Chart as ChartJS, ArcElement, Tooltip, ChartOptions } from 'chart.js';
import * as React from 'react';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

export const ColorCodesForCompressions: Record<number, string> = {
  0: '#5ECE71',
  1: '#1EBF89',
  2: '#1A8284',
  3: '#094D4C',
  4: '#FFFAE3',
  5: '#E8FBBA',
  6: '#D4FF72',
  7: '#95B0B7',
  8: '#CCDDE1',
  9: '#E2EDF0',
};

export const ColorCodesForKSizes: Record<number, string> = {
  25: '#E2EDF0',
  31: '#95B0B7',
  32: '#7676A9',
  33: '#C3C3EE',
  34: '#BCEFF2',
  35: '#474765',
};

export type DoughnutChartData = { data: number[]; colors: string[]; labels: string[] };

const donutOptions: ChartOptions<'doughnut'> = {
  plugins: {
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const plots = ctx.dataset.data[ctx.dataIndex];
          return `${(ctx.dataset as DoughnutChartData).labels[ctx.dataIndex]} - ${plots} plot${plots > 1 ? 's' : ''}`;
        },
      },
    },
  },
};

export type PlotDetailsProps = {
  kSizeData: DoughnutChartData;
  compressionData: DoughnutChartData;
};

export const PurePlotDetailsChart = React.memo(PlotDetailsChart);
function PlotDetailsChart(props: PlotDetailsProps) {
  const { kSizeData, compressionData } = props;
  const data = React.useMemo(
    () => ({
      datasets: [
        {
          data: compressionData.data,
          backgroundColor: compressionData.colors,
          labels: compressionData.labels,
          cutout: '66%',
          radius: '100%',
          borderWidth: 0,
        },
        {
          data: kSizeData.data,
          backgroundColor: kSizeData.colors,
          labels: kSizeData.labels,
          cutout: '66%',
          radius: '100%',
          borderWidth: 0,
        },
      ],
    }),
    [kSizeData, compressionData]
  );
  return <Doughnut data={data} options={donutOptions} />;
}
