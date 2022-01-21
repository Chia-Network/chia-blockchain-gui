import Big from 'big.js';
import Unit from '../constants/Unit';
import chiaFormatter from './chiaFormatter';

export default function mojoToChiaLocaleString(mojo: string | number | Big) {
  return chiaFormatter(Number(mojo), Unit.MOJO)
    .to(Unit.CHIA)
    .toLocaleString();
}