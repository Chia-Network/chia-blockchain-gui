const PLOT_FILTER_CONSTANTS = {
  mainnet: {
    HARD_FORK_HEIGHT: 5_496_000,
    PLOT_FILTER_128_HEIGHT: 10_542_000,
    PLOT_FILTER_64_HEIGHT: 15_592_000,
    PLOT_FILTER_32_HEIGHT: 20_643_000,
  },
  testnet10: {
    HARD_FORK_HEIGHT: 2_997_292,
    PLOT_FILTER_128_HEIGHT: 3_061_804,
    PLOT_FILTER_64_HEIGHT: 8_010_796,
    PLOT_FILTER_32_HEIGHT: 13_056_556,
  },
};

export function getPlotFilter(height: number = 0, isTestnet: boolean = false) {
  const constants = isTestnet ? PLOT_FILTER_CONSTANTS.testnet10 : PLOT_FILTER_CONSTANTS.mainnet;
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
