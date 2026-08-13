import { DappCommands } from './DappCommands';
import { isBalanceCommand } from './isBalanceCommand';
import { isDappAllowedCommand } from './isDappAllowedCommand';
import { isSignCommand } from './isSignCommand';
import { isSpendCommand } from './isSpendCommand';

export function classifyDappCommands(dappCommands: string[]) {
  const innocuous: string[] = [];
  const balance: string[] = [];
  const sign: string[] = [];
  const notifications: string[] = [];
  const spending: string[] = [];
  const other: string[] = [];

  if (!Array.isArray(dappCommands)) {
    throw new Error('Invalid dapp commands.');
  }

  const seen = new Set<string>();

  for (const dappCommand of dappCommands) {
    if (typeof dappCommand !== 'string' || dappCommand.trim() !== dappCommand || dappCommand.length === 0) {
      throw new Error(`Invalid dapp command: ${dappCommand}`);
    }

    if (seen.has(dappCommand)) {
      throw new Error(`Duplicate dapp command: ${dappCommand}`);
    }

    seen.add(dappCommand);

    if (dappCommand === 'chia_showNotification') {
      notifications.push(dappCommand);
    } else {
      const dappSchema = DappCommands.get(dappCommand);
      if (dappSchema) {
        const { commandId } = dappSchema;
        if (isBalanceCommand(commandId)) balance.push(dappCommand);
        else if (isDappAllowedCommand(commandId)) innocuous.push(dappCommand);
        else if (isSignCommand(commandId)) sign.push(dappCommand);
        else if (isSpendCommand(commandId)) spending.push(dappCommand);
        else other.push(dappCommand);
      }
    }
  }

  return {
    innocuous,
    balance,
    sign,
    notifications,
    spending,
    other,
  };
}
