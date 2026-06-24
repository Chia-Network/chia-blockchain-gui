import { sendCommand } from './sendCommand';

type NftInfoResponse = Record<string, unknown> & {
  nft_info?: {
    data_uris?: string[];
    data_hash?: string;
    license_uris?: string[];
    metadata_uris?: string[];
    metadata_hash?: string;
    license_hash?: string;
    royalty_percentage?: number;
    edition_number?: number;
    edition_total?: number;
    launcher_id?: string;
    launcher_puzhash?: string;
    minter_did?: string;
    nft_coin_confirmation_height?: number;
    nft_coin_id?: string;
    nft_id?: string;
    owner_did?: string;
    p2_address?: string;
    pending_transaction?: boolean;
    royalty_puzzle_hash?: string;
    supports_did?: boolean;
    updater_puzhash?: string;
  };
};

export async function nftGetInfo(launcherIdHex: string) {
  return sendCommand<NftInfoResponse>('nft_get_info', 'chia_wallet', {
    coin_id: launcherIdHex,
  });
}
