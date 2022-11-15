import type Foliage from './Foliage';
import type FoliageTransactionBlock from './FoliageTransactionBlock';

type Block = {
  foliage_transaction_block: FoliageTransactionBlock;
  foliage: Foliage;
};

export default Block;
