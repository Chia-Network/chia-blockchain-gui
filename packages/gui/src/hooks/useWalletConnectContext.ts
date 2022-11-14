import { useContext } from 'react';
import { WalletConnectContext } from '../components/walletConnect/WalletConnectProvider';

export default function useWalletConnectContext() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error(
      'useWalletConnectContext must be used within a WalletConnectProvider',
    );
  }

  return context;
}
