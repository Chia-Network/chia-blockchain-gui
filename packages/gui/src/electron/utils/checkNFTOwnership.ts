import sendCommand from './sendCommand';

export default async function checkNFTOwnership(nftId: string): Promise<boolean> {
  try {
    const response = await sendCommand<{
      success: boolean;
      pubkey?: string;
      signature?: string;
      latest_coin_id?: string;
      error?: string;
    }>('sign_message_by_id', 'chia_wallet', {
      id: nftId,
      message: 'x',
    });

    return response.success === true;
  } catch (error) {
    return false;
  }
}
