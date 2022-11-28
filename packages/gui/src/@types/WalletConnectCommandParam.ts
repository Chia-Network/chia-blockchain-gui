import { type ReactNode } from 'react';
import type BigNumber from 'bignumber.js';

type WalletConnectCommandParam = {
  name: string;
  isOptional?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  type?: 'string' | 'number' | 'boolean' | 'BigNumber' | 'object';
  defaultValue?: string | number | boolean | BigNumber | Record<any, any>;
  displayComponent?: (value: any) => ReactNode;
};

export default WalletConnectCommandParam;
