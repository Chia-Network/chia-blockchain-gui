import React, { ReactNode, createContext, useEffect } from 'react';

import type Notification from '../../@types/Notification';
import type Pair from '../../@types/Pair';
import type { PermissionsNotificationPayload } from '../../@types/PermissionsService';
import useNotifications from '../../hooks/useNotifications';
import useWalletConnect from '../../hooks/useWalletConnect';

export const WalletConnectChiaProjectId = 'f3f661fcfc24e2e6e6c6f926f02c9c6e';

export const WalletConnectContext = createContext<
  | {
      enabled: boolean;
      isLoading: boolean;
      error: Error | undefined;
      pair: (uri: string) => Promise<string>;
      disconnect: (topic: string) => Promise<void>;
      approveSession: (topic: string, fingerprints: number[], mainnet: boolean, methods?: string[]) => Promise<void>;
      rejectSession: (topic: string) => Promise<void>;
      pairs: {
        getPair: (topic: string) => Pair | undefined;
        get: () => Pair[];
      };
    }
  | undefined
>(undefined);

export type WalletConnectProviderProps = {
  children: ReactNode;
  projectId: string;
};

export default function WalletConnectProvider(props: WalletConnectProviderProps) {
  const { children, projectId } = props;

  const { showNotification } = useNotifications();

  // Main fires `permissions:notification` after a paired dapp's
  // `chia_showNotification` call passes the gate. Renderer just routes
  // the payload to its own notification system. Notification construction
  // (and the gate check) live in main — we used to do both renderer-side,
  // which meant a compromised renderer could fabricate notifications
  // attributed to any paired dapp.
  useEffect(
    () =>
      window.permissionsAPI.subscribeToNotification(
        (_event: unknown, notification: PermissionsNotificationPayload) => {
          // `PermissionsNotificationPayload` uses bare string literals for
          // `type`; the renderer's shared `Notification` type uses the
          // `NotificationType` enum. Same wire values, just a wider type
          // — safe to widen at the boundary.
          showNotification(notification as unknown as Notification);
        },
      ),
    [showNotification],
  );

  const walletConnect = useWalletConnect({ projectId });

  return <WalletConnectContext.Provider value={walletConnect}>{children}</WalletConnectContext.Provider>;
}
