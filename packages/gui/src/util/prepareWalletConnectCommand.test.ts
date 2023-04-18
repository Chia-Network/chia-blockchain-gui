import BigNumber from 'bignumber.js';

import type WalletConnectCommand from '../@types/WalletConnectCommand';
import prepareWalletConnectCommand from './prepareWalletConnectCommand';

describe('prepareWalletConnectCommand', () => {
  const commands: WalletConnectCommand[] = [
    {
      command: 'sampleCommand',
      params: [
        { name: 'param1', type: 'BigNumber', isOptional: false },
        { name: 'param2', type: 'number', isOptional: true, defaultValue: 42 },
        { name: 'param3', type: 'boolean', isOptional: false },
        { name: 'param4', type: 'string', isOptional: true, defaultValue: 'default' },
      ],
    },
  ];

  const commandsWithNoParams: WalletConnectCommand[] = [
    {
      command: 'sampleCommand',
    },
  ];

  const commandWithOptionalBoolean: WalletConnectCommand[] = [
    {
      command: 'sampleCommand',
      params: [
        { name: 'param1', type: 'BigNumber', isOptional: false },
        { name: 'param2', type: 'number', isOptional: true, defaultValue: 42 },
        { name: 'param3', type: 'boolean', isOptional: false },
        { name: 'param4', type: 'string', isOptional: true, defaultValue: 'default' },
        { name: 'param5', type: 'boolean', isOptional: true }, // Remove the defaultValue here
      ],
    },
  ];

  test('Valid command and values', () => {
    const result = prepareWalletConnectCommand(commands, 'chia_sampleCommand', {
      param1: '1234567890',
      param3: true,
    });

    expect(result.command).toBe('sampleCommand');
    expect(result.values).toEqual({
      param1: new BigNumber('1234567890'),
      param2: 42,
      param3: true,
      param4: 'default',
    });
    expect(result.definition).toBe(commands[0]);
  });

  test('Invalid command', () => {
    expect(() => prepareWalletConnectCommand(commands, 'chia_invalidCommand', {})).toThrowError(
      'Unknown command chia_invalidCommand'
    );
  });

  test('Missing required argument', () => {
    expect(() =>
      prepareWalletConnectCommand(commands, 'chia_sampleCommand', {
        param3: false,
      })
    ).toThrowError('Missing required argument param1');
  });

  test('Invalid BigNumber value', () => {
    expect(() =>
      prepareWalletConnectCommand(commands, 'chia_sampleCommand', {
        param1: 'invalid',
        param3: true,
      })
    ).toThrowError('Invalid BigNumber value for argument param1. Value: invalid');
  });

  test('Invalid number value', () => {
    const modifiedCommands = [
      {
        ...commands[0],
        params: [...commands[0].params, { name: 'param5', type: 'number', isOptional: false }],
      },
    ];

    expect(() =>
      prepareWalletConnectCommand(modifiedCommands, 'chia_sampleCommand', {
        param1: '1234567890',
        param3: true,
        param5: 'invalid',
      })
    ).toThrowError('Invalid number value for argument param5. Value: invalid');
  });

  test('prepare params with unknown type', () => {
    const modifiedCommands = [
      {
        ...commands[0],
        params: [
          ...commands[0].params,
          { name: 'param5', type: 'unknown', isOptional: false, defaultValue: 'unknown' },
        ],
      },
    ];

    const result = prepareWalletConnectCommand(modifiedCommands, 'chia_sampleCommand', {
      param1: '1234567890',
      param3: true,
    });

    expect(result.command).toBe('sampleCommand');
    expect(result.values).toEqual({
      param1: new BigNumber('1234567890'),
      param2: 42,
      param3: true,
      param4: 'default',
      param5: 'unknown',
    });
    expect(result.definition).toBe(modifiedCommands[0]);
  });

  test('BigNumber value is NaN', () => {
    expect(() =>
      prepareWalletConnectCommand(commands, 'chia_sampleCommand', {
        param1: NaN,
        param3: true,
      })
    ).toThrowError('Invalid BigNumber value for argument param1. Value: NaN');
  });

  test('Number value is NaN', () => {
    const modifiedCommands = [
      {
        ...commands[0],
        params: [...commands[0].params, { name: 'param5', type: 'number', isOptional: false }],
      },
    ];

    expect(() =>
      prepareWalletConnectCommand(modifiedCommands, 'chia_sampleCommand', {
        param1: '1234567890',
        param3: true,
        param5: NaN,
      })
    ).toThrowError('Invalid number value for argument param5. Value: NaN');
  });

  test('command without params', () => {
    const result = prepareWalletConnectCommand(commandsWithNoParams, 'chia_sampleCommand', {});

    expect(result.command).toBe('sampleCommand');
    expect(result.values).toEqual({});
    expect(result.definition).toBe(commandsWithNoParams[0]);
  });

  test('Optional boolean parameter without defaultValue', () => {
    const result = prepareWalletConnectCommand(commandWithOptionalBoolean, 'chia_sampleCommand', {
      param1: '1234567890',
      param3: true,
    });

    expect(result.command).toBe('sampleCommand');
    expect(result.values).toEqual({
      param1: new BigNumber('1234567890'),
      param2: 42,
      param3: true,
      param4: 'default',
    });
    expect(result.definition).toBe(commandWithOptionalBoolean[0]);
  });
});
