import { sendCommand } from './sendCommand';

type CatAssetIdToNameResponse = {
  name?: string;
};

export async function catAssetIdToName(assetId: string) {
  return sendCommand<CatAssetIdToNameResponse>('cat_asset_id_to_name', 'chia_wallet', {
    asset_id: assetId,
  });
}
