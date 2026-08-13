import WalletType from '../constants/WalletType';

import { getCatWalletName } from './getCatWalletName';
import { sendCommand } from './sendCommand';

type WalletListItem = {
  id: number;
  name?: string;
  type?: WalletType;
};

type GetWalletsResponse = Record<string, unknown> & {
  wallets?: WalletListItem[];
};

export type WalletInfo = {
  name?: string;
  type?: WalletType;
};

function isCatWalletType(type: WalletType | undefined): boolean {
  return type === WalletType.CAT || type === WalletType.RCAT || type === WalletType.CRCAT;
}

export async function getWalletInfos(): Promise<Record<string, WalletInfo>> {
  let wallets: WalletListItem[] = [];
  try {
    const response = await sendCommand<GetWalletsResponse>('get_wallets', 'chia_wallet');
    wallets = response.wallets ?? [];
  } catch {
    return {};
  }

  const walletInfos: Record<string, WalletInfo> = {};

  await Promise.all(
    wallets.map(async (wallet) => {
      if (wallet.type === WalletType.STANDARD_WALLET) {
        walletInfos[String(wallet.id)] = {
          name: 'Chia',
          type: wallet.type,
        };
        return;
      }

      if (isCatWalletType(wallet.type)) {
        try {
          const catName = await getCatWalletName(wallet.id);
          walletInfos[String(wallet.id)] = {
            name: catName ?? wallet.name ?? String(wallet.id),
            type: wallet.type,
          };
          return;
        } catch {
          walletInfos[String(wallet.id)] = {
            name: wallet.name ?? String(wallet.id),
            type: wallet.type,
          };
          return;
        }
      }

      walletInfos[String(wallet.id)] = {
        name: wallet.name ?? String(wallet.id),
        type: wallet.type,
      };
    }),
  );

  return walletInfos;
}

export async function getWalletNames(): Promise<Record<string, string>> {
  const walletInfos = await getWalletInfos();
  const walletNames: Record<string, string> = {};

  for (const [walletId, walletInfo] of Object.entries(walletInfos)) {
    if (walletInfo.name !== undefined) {
      walletNames[walletId] = walletInfo.name;
    }
  }

  return walletNames;
}
