import { sendCommand } from './sendCommand';

export type Key = {
  fingerprint: number;
  public_key: string;
  label?: string;
};

export async function getKeys(): Promise<Key[]> {
  const { keys = [] } = await sendCommand<{ keys?: Key[] }>('get_keys', 'daemon');

  return keys.map((k: Key) => ({
    fingerprint: k.fingerprint,
    public_key: k.public_key,
    label: k.label || undefined,
  }));
}
