import type BigNumber from 'bignumber.js';
import { type ReactNode } from 'react';

type WalletConnectCommandParam = {
  name: string;
  isOptional?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  type?: 'string' | 'number' | 'boolean' | 'BigNumber' | 'object';
  defaultValue?: string | number | boolean | BigNumber | Record<any, any>;
  displayComponent?: (value: any) => ReactNode;
  hide?: boolean;
};

export default WalletConnectCommandParam;
