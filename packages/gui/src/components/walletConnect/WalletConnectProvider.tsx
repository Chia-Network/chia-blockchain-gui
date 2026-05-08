import React, { ReactNode, createContext, useEffect } from 'react';

import type Pair from '../../@types/Pair';
import type { PermissionsNotificationPayload } from '../../@types/PermissionsService';
import useNotificationSettings from '../../hooks/useNotificationSettings';
import useNotifications from '../../hooks/useNotifications';
import useWalletConnect from '../../hooks/useWalletConnect';
import shouldRouteDappNotification from '../../util/shouldRouteDappNotification';

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
  const { dappOfferNotifications, dappAnnouncementNotifications } = useNotificationSettings();

  // Main fires `permissions:notification` after a paired dapp's
  // `chia_showNotification` passes the gate. shouldRouteDappNotification
  // applies the user-side mute toggles on top.
  useEffect(
    () =>
      window.permissionsAPI.subscribeToNotification((notification: PermissionsNotificationPayload) => {
        if (!shouldRouteDappNotification(notification, { dappOfferNotifications, dappAnnouncementNotifications })) {
          return;
        }
        // `PermissionsNotificationPayload` is a compile-time subset of the
        // renderer's `Notification` type (shared `NotificationType` enum,
        // narrower `source`/`from`), so no cast is needed.
        showNotification(notification);
      }),
    [showNotification, dappOfferNotifications, dappAnnouncementNotifications],
  );

  const walletConnect = useWalletConnect({ projectId });

  return <WalletConnectContext.Provider value={walletConnect}>{children}</WalletConnectContext.Provider>;
}
