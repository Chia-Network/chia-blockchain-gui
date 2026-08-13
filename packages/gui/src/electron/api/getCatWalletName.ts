import { sendCommand } from './sendCommand';

type CatGetNameResponse = Record<string, unknown> & {
  name?: string;
};

export async function getCatWalletName(walletId: number): Promise<string | undefined> {
  const { name } = await sendCommand<CatGetNameResponse>('cat_get_name', 'chia_wallet', {
    wallet_id: walletId,
  });

  return name;
}
