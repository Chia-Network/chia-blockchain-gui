import Big from 'big.js';

const MOJO_PER_CHIA = Big(1000000);
const BLOCKS_PER_YEAR = 1681920;

const GENESIS_BLOCK_REWARD = 180000000

export function calculatePoolReward(height: number): Big {
  if (height === 0) {
    return MOJO_PER_CHIA.times(GENESIS_BLOCK_REWARD).times(7 / 8);
  }
  if (height < 2 * BLOCKS_PER_YEAR) {
    return MOJO_PER_CHIA.times(20).times(7 / 8);
  }
  if (height < 4 * BLOCKS_PER_YEAR) {
    return MOJO_PER_CHIA.times(10).times(7 / 8);
  }
  if (height < 6 * BLOCKS_PER_YEAR) {
    return MOJO_PER_CHIA.times(5).times(7 / 8);
  }
  if (height < 8 * BLOCKS_PER_YEAR) {
    return MOJO_PER_CHIA.times(2.5).times(7 / 8);
  }

  return MOJO_PER_CHIA.times(1.25).times(7 / 8);
}

export function calculateBaseFarmerReward(height: number): Big {
  if (height === 0) {
    return MOJO_PER_CHIA.times(GENESIS_BLOCK_REWARD).times(1 / 8);
  }
  if (height < 2 * BLOCKS_PER_YEAR) {
    return MOJO_PER_CHIA.times(20).times(1 / 8);
  }
  if (height < 3 * BLOCKS_PER_YEAR) {
    return MOJO_PER_CHIA.times(10).times(1 / 8);
  }
  if (height < 6 * BLOCKS_PER_YEAR) {
    return MOJO_PER_CHIA.times(5).times(1 / 8);
  }
  if (height < 8 * BLOCKS_PER_YEAR) {
    return MOJO_PER_CHIA.times(2.5).times(1 / 8);
  }

  return MOJO_PER_CHIA.times(1.25).times(1 / 8);
}
