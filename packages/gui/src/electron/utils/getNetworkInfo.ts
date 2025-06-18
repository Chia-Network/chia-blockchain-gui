import sendCommand from './sendCommand';

export default async function getNetworkInfo() {
  const data = await sendCommand('get_network_info', 'chia_wallet');

  return {
    networkName: data.network_name,
    networkPrefix: data.network_prefix,
  };
}
