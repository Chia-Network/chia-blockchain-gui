import { LatencyRecord } from '@chia-network/api';
import { alpha, useTheme } from '@mui/material/styles';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, BarController, ChartOptions } from 'chart.js';
import * as React from 'react';
import { Bar } from 'react-chartjs-2';

import { getSemanticColors } from '../../util/semanticColors';

ChartJS.register(BarElement, CategoryScale, LinearScale, BarController);

export function getSliceOfLatency(data: LatencyRecord[], period: '1h' | '12h' | '24h' | '64sp') {
  if (period.endsWith('sp')) {
    const n = +period.split('sp')[0];
    return data.slice(data.length - n);
  }

  const periodInHours = +period.split('h')[0];
  const now = Date.now();
  const periodInMs = 3_600_000 * periodInHours;

  // @TODO Replace below with better algorithm for performance
  for (let i = 0; i < data.length; i++) {
    const d = data[i][0];
    if (now - d < periodInMs) {
      return data.slice(i);
    }
  }
  return [] as LatencyRecord[];
}

export function formatTime(timeInMs: number) {
  if (timeInMs < 1000) {
    return `${timeInMs} ms`;
  }

  const [integerPart, decimalPart] = `${timeInMs / 1000}`.split('.');
  let intStr = '';

  for (let i = 0; i < integerPart.length; i++) {
    const tailIndex = integerPart.length - 1 - i;
    if (i % 3 === 0 && i !== 0) {
      intStr = `${integerPart.charAt(tailIndex)},${intStr}`;
    } else {
      intStr = integerPart.charAt(tailIndex) + intStr;
    }
  }

  if (typeof decimalPart === 'string') {
    const decimalStr = `${Math.round(+decimalPart.slice(0, 4) / 10) / 1000}`.replace(/^0[.]/, '');
    return `${intStr}.${decimalStr} s`;
  }

  return `${intStr} s`;
}

export type BarChartProps = {
  period: '1h' | '12h' | '24h' | '64sp';
  latency: LatencyRecord[];
  unit: 's' | 'ms';
};
export const PureLatencyBarChart = React.memo(LatencyBarChart);
function LatencyBarChart(props: BarChartProps) {
  const { latency, period, unit } = props;
  const theme = useTheme();
  const { palette } = theme;
  const semanticColors = getSemanticColors(palette);
  const primaryColor = semanticColors.success;
  const warningColor = semanticColors.warning;
  const errorColor = semanticColors.error;

  const options = React.useMemo<ChartOptions<'bar'>>(
    () => ({
      responsive: true,
      animation: false,
      maintainAspectRatio: false,
      scales: {
        x: {
          display: false,
        },
        y: {
          grid: {
            color: alpha(palette.text.primary, 0.16),
          },
          ticks: {
            color: palette.text.secondary,
            callback(value: string | number) {
              const numericValue = Number(value);
              const formattedValue = unit === 'ms' ? numericValue : numericValue / 1000;
              return `${formattedValue} ${unit}`;
            },
          },
        },
      },
    }),
    [palette.text.primary, palette.text.secondary, unit],
  );

  const data = React.useMemo(() => {
    const labels: string[] = [];
    const records: number[] = [];
    const backgroundColors: string[] = [];

    if (period.endsWith('sp')) {
      const nData = Math.min(latency.length, +period.split('sp')[0]);

      for (let i = latency.length - nData; i < latency.length; i++) {
        const [t, val] = latency[i];
        labels.push(`${t}`);
        const valInMs = val / 1000;
        records.push(valInMs);
        if (valInMs < 8000) {
          // Normal color
          backgroundColors.push(primaryColor);
        } else if (valInMs < 20_000) {
          // Warning color
          backgroundColors.push(warningColor);
        } else {
          // Fatal color
          backgroundColors.push(errorColor);
        }
      }

      return {
        labels,
        datasets: [
          {
            data: records,
            backgroundColor: backgroundColors,
            skipNull: true,
            barThickness: 5,
          },
        ],
      };
    }

    if (period.endsWith('h')) {
      for (let i = 0; i < latency.length; i++) {
        const [t, val] = latency[i];
        labels.push(`${t}`);
        const valInMs = val / 1000;
        records.push(valInMs);
        if (valInMs < 8000) {
          // Normal color
          backgroundColors.push(primaryColor);
        } else if (valInMs < 20_000) {
          // Warning color
          backgroundColors.push(warningColor);
        } else {
          // Fatal color
          backgroundColors.push(errorColor);
        }
      }
    }

    return {
      labels,
      datasets: [
        {
          data: records,
          backgroundColor: backgroundColors,
          skipNull: true,
          barThickness: 1,
        },
      ],
    };
  }, [latency, period, primaryColor, warningColor, errorColor]);

  return <Bar data={data} options={options} height={240} />;
}
