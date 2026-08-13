import type BigNumber from 'bignumber.js';

import Unit from '../constants/Unit';

import chiaFormatter from './chiaFormatter';

export default function chiaToMojo(chia: string | number | bigint | BigNumber): BigInt {
  return BigInt(chiaFormatter(chia, Unit.CHIA).to(Unit.MOJO).toBigNumber().toFixed(0));
}
