import { ReactNode } from 'react';
import type BigNumber from 'bignumber.js';

type WalletConnectCommandParam = {
  name: string;
  isOptional?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  type?: 'string' | 'number' | 'boolean' | 'BigNumber';
  defaultValue?: string | number | boolean | BigNumber;
};

export default WalletConnectCommandParam;
