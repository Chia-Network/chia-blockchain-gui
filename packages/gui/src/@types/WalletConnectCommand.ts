import { type ServiceNameValue } from '@chia-network/api';
import { ReactNode } from 'react';

import type WalletConnectCommandParam from './WalletConnectCommandParam';

type WalletConnectCommandBase = {
  command: string;
  label: ReactNode;
  description?: ReactNode;
  service: ServiceNameValue;
  allFingerprints?: boolean;
  waitForSync?: boolean;
  params?: WalletConnectCommandParam[];
  bypassConfirm?: boolean;
};

export type WalletConnectCommandNotification = Omit<WalletConnectCommandBase, 'service'> & {
  service: 'NOTIFICATION';
};

export type WalletConnectCommandExecute = Omit<WalletConnectCommandBase, 'service'> & {
  service: 'EXECUTE';
  execute: Object | ((params: Record<string, any>) => Object);
};

type WalletConnectCommand = WalletConnectCommandBase | WalletConnectCommandNotification | WalletConnectCommandExecute;

export default WalletConnectCommand;
