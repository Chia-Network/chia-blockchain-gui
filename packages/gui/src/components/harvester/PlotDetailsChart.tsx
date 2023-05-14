import { Chart as ChartJS, ArcElement } from 'chart.js';
import * as React from 'react';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement);

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

export type DoughnutChartData = { data: number[]; colors: string[] };

export type PlotDetailsProps = {
  compressionData: DoughnutChartData;
  sizeData: DoughnutChartData;
};

export const PurePlotDetailsChart = React.memo(PlotDetailsChart);
function PlotDetailsChart(props: PlotDetailsProps) {
  const { compressionData, sizeData } = props;
  const data = React.useMemo(
    () => ({
      datasets: [
        {
          data: compressionData.data,
          backgroundColor: compressionData.colors,
          cutout: '75%',
          radius: '100%',
          borderWidth: 0,
        },
        {
          data: sizeData.data,
          backgroundColor: sizeData.colors,
          cutout: '70%',
          radius: '85%',
          borderWidth: sizeData.data.length > 1 ? 2 : 0,
        },
      ],
    }),
    [compressionData, sizeData]
  );
  return <Doughnut data={data} />;
}
