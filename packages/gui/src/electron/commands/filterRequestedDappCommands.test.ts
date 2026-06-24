import { filterRequestedDappCommands } from './filterRequestedDappCommands';

describe('filterRequestedDappCommands', () => {
  it('allows known dapp commands and rejects unknown commands without changing request order', () => {
    expect(
      filterRequestedDappCommands([
        'chia_unknownCommand',
        'chia_logIn',
        'chia_requestPermissions',
        'chia_getPublicKey',
        'chia_transferDID',
        'chia_deleteEverything',
      ]),
    ).toEqual({
      allowed: ['chia_requestPermissions', 'chia_getPublicKey', 'chia_transferDID'],
      rejected: ['chia_unknownCommand', 'chia_logIn', 'chia_deleteEverything'],
    });
  });

  it('deduplicates commands before classifying them', () => {
    expect(
      filterRequestedDappCommands([
        'chia_logIn',
        'chia_logIn',
        'chia_unknownCommand',
        'chia_unknownCommand',
        'chia_getPublicKey',
      ]),
    ).toEqual({
      allowed: ['chia_getPublicKey'],
      rejected: ['chia_logIn', 'chia_unknownCommand'],
    });
  });

  it('ignores malformed non-string and empty command entries', () => {
    expect(
      filterRequestedDappCommands([
        '',
        null,
        undefined,
        0,
        false,
        { command: 'chia_logIn' },
        ['chia_getPublicKey'],
        'chia_getPublicKey',
      ] as unknown as string[]),
    ).toEqual({
      allowed: ['chia_getPublicKey'],
      rejected: [],
    });
  });

  it('rejects lookalike commands instead of normalizing dapp input', () => {
    expect(
      filterRequestedDappCommands([' chia_getPublicKey', 'chia_getPublicKey ', 'CHIA_GETPUBLICKEY', 'chia_getPublicKey']),
    ).toEqual({
      allowed: ['chia_getPublicKey'],
      rejected: [' chia_getPublicKey', 'chia_getPublicKey ', 'CHIA_GETPUBLICKEY'],
    });
  });

  it('rejects missing or non-array command lists', () => {
    expect(() => filterRequestedDappCommands(null as unknown as string[])).toThrow('Invalid dapp commands.');

    expect(() => filterRequestedDappCommands({ 0: 'chia_logIn', length: 1 } as unknown as string[])).toThrow(
      'Invalid dapp commands.',
    );
  });
});
