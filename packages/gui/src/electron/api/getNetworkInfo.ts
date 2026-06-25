import { sendCommand } from './sendCommand';

export async function getNetworkInfo() {
  const data = await sendCommand<{
    network_name?: string;
    network_prefix?: string;
  }>('get_network_info', 'chia_wallet');

  return {
    networkName: data.network_name,
    networkPrefix: data.network_prefix,
  };
}
