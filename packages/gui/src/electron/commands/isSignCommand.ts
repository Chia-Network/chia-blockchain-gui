import { Commands } from './Commands';

const SIGN_COMMANDS = new Set<keyof typeof Commands>([
  'chia_wallet.sign_message_by_address',
  'chia_wallet.sign_message_by_id',
]);

export function isSignCommand(command: string): boolean {
  return SIGN_COMMANDS.has(command);
}
