import type BigNumber from 'bignumber.js';
import { type ReactNode } from 'react';

import WalletConnectCommandParamName from './WalletConnectCommandParamName';

type WalletConnectCommandParam = {
  name: WalletConnectCommandParamName;
  isOptional?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  type?: 'string' | 'number' | 'boolean' | 'BigNumber' | 'object';
  defaultValue?: string | number | boolean | BigNumber | Record<any, any>;
  displayComponent?: (
    value: any,
    params: WalletConnectCommandParam[],
    values: Record<string, any>,
    onChange: (values: Record<string, any>) => void
  ) => ReactNode;
  hide?: boolean;
};

export default WalletConnectCommandParam;
