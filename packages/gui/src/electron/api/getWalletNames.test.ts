import WalletType from '../constants/WalletType';

type SendCommandResponse = Record<string, unknown>;

const mockSendCommand = jest.fn<Promise<SendCommandResponse>, [string, string, Record<string, unknown>?]>();
const mockGetCatWalletName = jest.fn<Promise<string | undefined>, [number]>();

jest.mock('./sendCommand', () => ({
  sendCommand: mockSendCommand,
}));

jest.mock('./getCatWalletName', () => ({
  getCatWalletName: mockGetCatWalletName,
}));

const { getWalletNames } = jest.requireActual<typeof import('./getWalletNames')>('./getWalletNames');

describe('getWalletNames', () => {
  beforeEach(() => {
    mockSendCommand.mockReset();
    mockGetCatWalletName.mockReset();
  });

  it('returns Chia for the standard wallet and CAT RPC names for CAT wallets', async () => {
    mockSendCommand.mockImplementation(async (command) => {
      if (command === 'get_wallets') {
        return {
          wallets: [
            { id: 1, type: WalletType.STANDARD_WALLET, name: 'Wallet 1' },
            { id: 6, type: WalletType.CAT, name: 'CAT Wallet' },
          ],
        };
      }

      throw new Error(`Unexpected command: ${command}`);
    });
    mockGetCatWalletName.mockResolvedValue('Test CAT');

    await expect(getWalletNames()).resolves.toEqual({
      1: 'Chia',
      6: 'Test CAT',
    });
    expect(mockGetCatWalletName).toHaveBeenCalledWith(6);
  });

  it('returns an empty map when wallet lookup fails', async () => {
    mockSendCommand.mockRejectedValue(new Error('wallet unavailable'));

    await expect(getWalletNames()).resolves.toEqual({});
  });
});
