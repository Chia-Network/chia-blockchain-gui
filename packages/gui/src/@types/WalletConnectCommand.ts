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

export type WalletConnectCommandTest = Omit<WalletConnectCommandBase, 'service'> & {
  service: 'TEST';
  response: Object | ((params: Record<string, any>) => Object);
};

type WalletConnectCommand = WalletConnectCommandBase | WalletConnectCommandNotification | WalletConnectCommandTest;

export default WalletConnectCommand;
