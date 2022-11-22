import { ReactNode } from 'react';
import { type ServiceName } from '@chia/api';
import type WalletConnectCommandParam from './WalletConnectCommandParam';

type WalletConnectCommand = {
  command: string;
  label: ReactNode;
  service: ServiceName;
  allFingerprints?: boolean;
  params?: WalletConnectCommandParam[];
};

export default WalletConnectCommand;
