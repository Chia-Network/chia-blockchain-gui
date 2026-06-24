import { DappCommands } from './DappCommands';

export function getDappCommandSchema(dappCommand: string) {
  const entry = DappCommands.get(dappCommand);
  if (!entry) {
    throw new Error(`Unknown dapp command: ${dappCommand}`);
  }

  return entry;
}
