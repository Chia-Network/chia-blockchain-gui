import BigNumber from 'bignumber.js';

import type WalletConnectCommand from '../@types/WalletConnectCommand';

export default function prepareWalletConnectCommand(
  commands: WalletConnectCommand[],
  command: string,
  values: Record<string, any>
) {
  // remove chia_ prefix from command
  const commandName = command.replace(/^chia_/, '');

  const definition = commands.find((c) => c.command === commandName);
  if (!definition) {
    throw new Error(`Unknown command ${command}`);
  }

  // prepare params
  const parsedValues: Record<string, any> = {};

  const { params: definitionParams = [] } = definition;

  definitionParams.forEach((arg) => {
    const { name, isOptional, type, defaultValue } = arg;
    const value = name in values ? values[name] : defaultValue;

    if (value === undefined && !isOptional) {
      throw new Error(`Missing required argument ${name}`);
    }

    if (value !== undefined) {
      if (type === 'BigNumber') {
        parsedValues[name] = new BigNumber(value);

        if (parsedValues[name].isNaN()) {
          throw new Error(`Invalid BigNumber value for argument ${name}. Value: ${value}`);
        }
      } else if (type === 'number') {
        parsedValues[name] = Number(value);

        if (Number.isNaN(parsedValues[name])) {
          throw new Error(`Invalid number value for argument ${name}. Value: ${value}`);
        }
      } else if (type === 'boolean') {
        parsedValues[name] = Boolean(value);
      } else if (type === 'string') {
        parsedValues[name] = String(value);
      } else {
        parsedValues[name] = value;
      }
    }
  });

  return {
    command: commandName,
    values: parsedValues,
    definition,
  };
}
