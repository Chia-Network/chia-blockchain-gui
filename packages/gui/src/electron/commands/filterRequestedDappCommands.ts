import { DappCommands } from './DappCommands';

export function filterRequestedDappCommands(dappCommands: string[]): {
  allowed: string[];
  rejected: string[];
} {
  const allowed: string[] = [];
  const rejected: string[] = [];

  if (!Array.isArray(dappCommands)) {
    throw new Error('Invalid dapp commands.');
  }

  const seen = new Set<string>();

  for (const dappCommand of dappCommands) {
    if (typeof dappCommand === 'string' && dappCommand && !seen.has(dappCommand)) {
      seen.add(dappCommand);

      if (DappCommands.has(dappCommand)) {
        allowed.push(dappCommand);
      } else {
        rejected.push(dappCommand);
      }
    }
  }

  return { allowed, rejected };
}
