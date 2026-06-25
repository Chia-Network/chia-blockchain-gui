import { getKeys } from './getKeys';
import { sendCommand } from './sendCommand';

type PrivateKeyResponse = {
  private_key: {
    farmer_pk: string;
    pool_pk: string;
    sk: string;
    seed: string;
  };
};

export async function getKeyDetails(fingerprint: number | string) {
  const keys = await getKeys();
  const fingerprintNumber = Number(fingerprint);

  const index = keys.findIndex((key) => key.fingerprint === fingerprintNumber);
  if (index === -1) {
    throw new Error('Key not found');
  }

  const key = keys[index];

  const { private_key: privateKey } = await sendCommand<PrivateKeyResponse>('get_private_key', 'chia_wallet', {
    fingerprint: fingerprintNumber,
  });

  return {
    index,
    label: key.label,
    fingerprint: key.fingerprint,
    publicKey: key.public_key,

    farmerPublicKey: privateKey.farmer_pk,
    poolPublicKey: privateKey.pool_pk,
    secretKey: privateKey.sk,
    seed: privateKey.seed,
  };
}
