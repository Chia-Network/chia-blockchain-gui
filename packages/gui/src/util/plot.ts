import { PLOT_FILTER_CONSTANTS } from '@chia-network/api';

export function getPlotFilter(height: number = 0, isTestnet: boolean = false) {
  const constants = isTestnet ? PLOT_FILTER_CONSTANTS.testnet11 : PLOT_FILTER_CONSTANTS.mainnet;
  let prefixBits = 9;

  if (height >= constants.PLOT_FILTER_32_HEIGHT) {
    prefixBits -= 4;
  } else if (height >= constants.PLOT_FILTER_64_HEIGHT) {
    prefixBits -= 3;
  } else if (height >= constants.PLOT_FILTER_128_HEIGHT) {
    prefixBits -= 2;
  } else if (height >= constants.HARD_FORK_HEIGHT) {
    prefixBits -= 1;
  }

  prefixBits = Math.max(0, prefixBits);

  return 2 ** prefixBits;
}
