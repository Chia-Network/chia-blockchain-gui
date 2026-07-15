type SafeJson = {
  safeJsonParse(value: string): unknown;
};

const { safeJsonParse } = require('@walletconnect/safe-json') as SafeJson;

describe('@walletconnect/safe-json', () => {
  it('parses WalletConnect negative bigint strings as bigint values', () => {
    expect(safeJsonParse('{"amount":"-1000n"}')).toEqual({ amount: -1000n });
  });
});
