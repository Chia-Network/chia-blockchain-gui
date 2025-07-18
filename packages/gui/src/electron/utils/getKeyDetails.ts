import sendCommand from './sendCommand';

export default async function getKeyDetails(fingerprint: string) {
  const { keys } = await sendCommand('get_keys', 'daemon', { fingerprint });

  const findIndex = keys.findIndex((key: any) => key.fingerprint.toString() === fingerprint);
  if (findIndex === -1) {
    throw new Error('Key not found');
  }

  const key = keys[findIndex];

  const { private_key: privateKey } = await sendCommand('get_private_key', 'chia_wallet', { fingerprint });

  return {
    index: findIndex,
    label: key.label,
    fingerprint: key.fingerprint,
    publicKey: key.public_key,

    farmerPublicKey: privateKey.farmer_pk,
    poolPublicKey: privateKey.pool_pk,
    secretKey: privateKey.sk,
    seed: privateKey.seed,
  };
}
