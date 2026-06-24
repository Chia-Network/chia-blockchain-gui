import { WcError, WcErrorCode } from '../../@types/WcError';

import type { PairRecord } from './pairSchemas';
import { updatePair } from './pairStore';

type AddDappBypassPermissionsResult = {
  success: true;
  commands: string[];
};

type AddDappBypassPermissionsOptions = {
  canBypassCommand: (command: string) => boolean;
};

function getRequestedCommands(
  pair: PairRecord,
  params: Record<string, unknown>,
  options: AddDappBypassPermissionsOptions,
): string[] {
  const { commands } = params;

  if (!Array.isArray(commands) || commands.length === 0) {
    throw new WcError('commands are required', WcErrorCode.INVALID_PARAMS);
  }

  const seen = new Set<string>();
  for (const command of commands) {
    if (typeof command !== 'string' || command.trim() !== command || command.length === 0) {
      throw new WcError(`Invalid dapp command: ${command}`, WcErrorCode.INVALID_PARAMS);
    }

    if (seen.has(command)) {
      throw new WcError(`Duplicate dapp command: ${command}`, WcErrorCode.INVALID_PARAMS);
    }

    if (command === 'chia_requestPermissions') {
      throw new WcError('Cannot request chia_requestPermissions', WcErrorCode.INVALID_PARAMS);
    }

    if (!pair.commands.includes(command)) {
      throw new WcError(`Command not allowed for this pair: ${command}`, WcErrorCode.UNAUTHORIZED_METHOD, {
        data: { rejected: [command] },
      });
    }

    if (!options.canBypassCommand(command)) {
      throw new WcError(`Command cannot bypass confirmation: ${command}`, WcErrorCode.INVALID_PARAMS, {
        data: { rejected: [command] },
      });
    }

    seen.add(command);
  }

  return commands;
}

export function addDappBypassPermissions(
  pair: PairRecord,
  params: Record<string, unknown>,
  options: AddDappBypassPermissionsOptions,
): AddDappBypassPermissionsResult {
  const requestedCommands = getRequestedCommands(pair, params, options);
  const bypassSet = new Set([...pair.bypass, ...requestedCommands]);

  updatePair(pair.topic, {
    bypass: [...bypassSet],
  });

  return {
    success: true,
    commands: requestedCommands,
  };
}
