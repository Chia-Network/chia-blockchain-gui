import { sendCommand } from './sendCommand';

type CatAssetIdToNameResponse = {
  wallet_id?: number | null;
  name?: string | null;
};

export async function catAssetIdToName(assetId: string) {
  return sendCommand<CatAssetIdToNameResponse>('cat_asset_id_to_name', 'chia_wallet', {
    asset_id: assetId,
  });
}
