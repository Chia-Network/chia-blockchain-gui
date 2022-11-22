import BigNumber from 'bignumber.js';
import type WalletConnectCommand from '../@types/WalletConnectCommand';

export default function prepareWalletConnectCommand(
  commands: WalletConnectCommand[],
  command: string,
  params: Record<string, any>,
) {
  // remove chia_ prefix from command
  const commandName = command.replace(/^chia_/, '');

  const definition = commands.find((c) => c.command === commandName);
  if (!definition) {
    throw new Error(`Unknown command ${command}`);
  }

  // prepare params
  const parsedParams: Record<string, any> = {};

  const { params: definitionParams = [] } = definition;

  definitionParams.forEach((arg) => {
    const { name, isOptional, type, defaultValue } = arg;
    const value = name in params ? params[name] : defaultValue;

    if (value === undefined && !isOptional) {
      throw new Error(`Missing required argument ${name}`);
    }

    if (value !== undefined) {
      if (type === 'BigNumber') {
        parsedParams[name] = new BigNumber(value);
      } else if (type === 'number') {
        parsedParams[name] = Number(value);
      } else if (type === 'boolean') {
        parsedParams[name] = Boolean(value);
      } else if (type === 'string') {
        parsedParams[name] = String(value);
      } else {
        parsedParams[name] = value;
      }
    }
  });

  return {
    command: commandName,
    params: parsedParams,
    definition,
  };
}
