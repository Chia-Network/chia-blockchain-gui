import { classifyDappCommands } from './classifyDappCommands';

describe('classifyDappCommands', () => {
  it('returns empty groups when no commands are requested', () => {
    expect(classifyDappCommands([])).toEqual({
      innocuous: [],
      balance: [],
      sign: [],
      notifications: [],
      spending: [],
      other: [],
    });
  });

  it('classifies known commands into permission groups without changing request order within each group', () => {
    expect(
      classifyDappCommands([
        'chia_getWallets',
        'chia_getWalletBalance',
        'chia_signMessageByAddress',
        'chia_showNotification',
        'chia_requestPermissions',
        'chia_sendTransaction',
        'chia_getTransaction',
        'chia_getWalletBalances',
        'chia_signMessageById',
        'chia_pushTransactions',
        'chia_getPublicKey',
        'chia_transferDID',
      ]),
    ).toEqual({
      innocuous: ['chia_getWallets', 'chia_getTransaction'],
      balance: ['chia_getWalletBalance', 'chia_getWalletBalances'],
      sign: ['chia_signMessageByAddress', 'chia_signMessageById'],
      notifications: ['chia_showNotification'],
      spending: ['chia_sendTransaction', 'chia_pushTransactions', 'chia_transferDID'],
      other: ['chia_requestPermissions', 'chia_getPublicKey'],
    });
  });

  it('rejects duplicate command entries before granting permissions', () => {
    expect(() => classifyDappCommands(['chia_getWallets', 'chia_getWallets'])).toThrow(
      'Duplicate dapp command: chia_getWallets',
    );

    expect(() => classifyDappCommands(['chia_unknownCommand', 'chia_unknownCommand'])).toThrow(
      'Duplicate dapp command: chia_unknownCommand',
    );
  });

  it('does not grant categories to unknown commands', () => {
    expect(classifyDappCommands(['chia_deleteEverything', 'CHIA_GETWALLETS', 'chia_getWallets'])).toEqual({
      innocuous: ['chia_getWallets'],
      balance: [],
      sign: [],
      notifications: [],
      spending: [],
      other: [],
    });
  });

  it('rejects lookalike commands instead of normalizing dapp input', () => {
    expect(() => classifyDappCommands([' chia_getWallets'])).toThrow('Invalid dapp command:  chia_getWallets');

    expect(() => classifyDappCommands(['chia_getWallets '])).toThrow('Invalid dapp command: chia_getWallets ');
  });

  it('rejects malformed command entries and missing command lists', () => {
    expect(() => classifyDappCommands([''])).toThrow('Invalid dapp command: ');

    expect(() => classifyDappCommands([null] as unknown as string[])).toThrow('Invalid dapp command: null');

    expect(() => classifyDappCommands([undefined] as unknown as string[])).toThrow('Invalid dapp command: undefined');

    expect(() => classifyDappCommands([0] as unknown as string[])).toThrow('Invalid dapp command: 0');

    expect(() => classifyDappCommands([false] as unknown as string[])).toThrow('Invalid dapp command: false');

    expect(() => classifyDappCommands([{ command: 'chia_getWallets' }] as unknown as string[])).toThrow(
      'Invalid dapp command: [object Object]',
    );

    expect(() => classifyDappCommands([['chia_showNotification']] as unknown as string[])).toThrow(
      'Invalid dapp command: chia_showNotification',
    );

    expect(() => classifyDappCommands(null as unknown as string[])).toThrow('Invalid dapp commands.');
  });
});
