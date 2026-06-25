import JSONbig from 'json-bigint';

import { parseDappParams } from './parseDappParams';

function serialize(value: unknown): string {
  return JSONbig.stringify(value);
}

describe('parseDappParams', () => {
  describe('parameter allowlist and defaults', () => {
    it('rejects unknown dapp commands before parsing params against a schema', () => {
      expect(() => parseDappParams('chia_unknownCommand', serialize({}))).toThrow(
        'Unknown dapp command: chia_unknownCommand',
      );
    });

    it('rejects params that are not declared by the dapp command schema', () => {
      expect(() =>
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '1',
            fee: '0',
            address: 'txch1address',
            evilExtra: 'not allowed',
          }),
        ),
      ).toThrow('param not allowed for dapp: evil_extra');
    });

    it('normalizes camelCase params to snake_case before allowlist validation', () => {
      const result = parseDappParams(
        'chia_pushTransactions',
        serialize({
          transactions: [{ spendBundle: { aggregatedSignature: '0x1234' } }],
          allowUnsynced: true,
        }),
      );

      expect(result).toMatchObject({
        transactions: [{ spend_bundle: { aggregated_signature: '0x1234' } }],
        allow_unsynced: true,
      });
    });

    it('applies schema defaults only when the dapp omitted the value', () => {
      expect(
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '1',
            fee: '0',
            address: 'txch1address',
          }),
        ),
      ).toMatchObject({
        amount: 1n,
        fee: 0n,
        address: 'txch1address',
        wallet_id: 1,
      });

      expect(
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '1',
            fee: '0',
            address: 'txch1address',
            walletId: 2,
          }),
        ),
      ).toMatchObject({
        wallet_id: 2,
      });
    });

    it('preserves defaults that are intentionally not part of the dapp param list', () => {
      expect(
        parseDappParams(
          'chia_addCATToken',
          serialize({
            name: 'Example CAT',
            assetId: '0xabc',
          }),
        ),
      ).toMatchObject({
        name: 'Example CAT',
        asset_id: '0xabc',
        wallet_type: 'cat_wallet',
        mode: 'existing',
        fee: 0,
      });
    });

    it('allows request-permissions command lists for the custom handler', () => {
      expect(
        parseDappParams(
          'chia_requestPermissions',
          serialize({
            commands: ['chia_getWalletBalance', 'chia_showNotification'],
          }),
        ),
      ).toEqual({
        commands: ['chia_getWalletBalance', 'chia_showNotification'],
      });
    });
  });

  describe('required and optional params', () => {
    it('rejects missing required params', () => {
      expect(() =>
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '1',
            fee: '0',
          }),
        ),
      ).toThrow('param is required: address');
    });

    it('keeps omitted optional params undefined and out of the returned payload', () => {
      const result = parseDappParams(
        'chia_pushTransactions',
        serialize({
          transactions: [],
        }),
      );

      expect(result).toEqual({
        transactions: [],
      });
      expect(result).not.toHaveProperty('fee');
      expect(result).not.toHaveProperty('sign');
      expect(result).not.toHaveProperty('push');
      expect(result).not.toHaveProperty('allow_unsynced');
    });
  });

  describe('fingerprint handling', () => {
    it('strips fingerprint when the target dapp command does not declare it', () => {
      const result = parseDappParams(
        'chia_sendTransaction',
        serialize({
          fingerprint: 123_456,
          amount: '1',
          fee: '0',
          address: 'txch1address',
        }),
      );

      expect(result).not.toHaveProperty('fingerprint');
    });

    it('preserves and parses fingerprint for public-key commands that declare it', () => {
      expect(parseDappParams('chia_getPublicKey', serialize({ fingerprint: 123_456 }))).toEqual({
        fingerprint: 123_456,
      });
    });
  });

  describe('string params', () => {
    it('coerces declared string params with String()', () => {
      expect(
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '1',
            fee: '0',
            address: 12_345,
          }),
        ),
      ).toMatchObject({
        address: '12345',
      });
    });
  });

  describe('number params', () => {
    it('coerces declared number params with Number()', () => {
      expect(
        parseDappParams(
          'chia_selectCoins',
          serialize({
            walletId: '1',
            amount: '100',
          }),
        ),
      ).toMatchObject({
        wallet_id: 1,
        amount: 100n,
      });
    });

    it('rejects number params that cannot be parsed as numbers', () => {
      expect(() => parseDappParams('chia_getPublicKey', serialize({ fingerprint: 'not-a-number' }))).toThrow(
        'Invalid number value for argument fingerprint. Value: not-a-number',
      );
    });
  });

  describe('boolean params', () => {
    it('preserves false boolean params exactly', () => {
      expect(
        parseDappParams(
          'chia_pushTransactions',
          serialize({
            transactions: [],
            sign: false,
            push: false,
            allowUnsynced: false,
          }),
        ),
      ).toMatchObject({
        sign: false,
        push: false,
        allow_unsynced: false,
      });
    });

    it('preserves true boolean params exactly', () => {
      expect(
        parseDappParams(
          'chia_pushTransactions',
          serialize({
            transactions: [],
            sign: true,
            push: true,
            allowUnsynced: true,
          }),
        ),
      ).toMatchObject({
        sign: true,
        push: true,
        allow_unsynced: true,
      });
    });

    it('rejects string booleans so sign cannot be smuggled through coercion', () => {
      expect(() =>
        parseDappParams(
          'chia_pushTransactions',
          serialize({
            transactions: [],
            sign: 'false',
          }),
        ),
      ).toThrow('Invalid boolean value for argument sign. Value: false');

      expect(() =>
        parseDappParams(
          'chia_pushTransactions',
          serialize({
            transactions: [],
            sign: 'true',
          }),
        ),
      ).toThrow('Invalid boolean value for argument sign. Value: true');
    });

    it('rejects numeric booleans instead of treating 0 or 1 as auth decisions', () => {
      expect(() =>
        parseDappParams(
          'chia_pushTransactions',
          serialize({
            transactions: [],
            sign: 0,
          }),
        ),
      ).toThrow('Invalid boolean value for argument sign. Value: 0');

      expect(() =>
        parseDappParams(
          'chia_pushTransactions',
          serialize({
            transactions: [],
            sign: 1,
          }),
        ),
      ).toThrow('Invalid boolean value for argument sign. Value: 1');
    });

    it('rejects object booleans', () => {
      expect(() =>
        parseDappParams(
          'chia_pushTransactions',
          serialize({
            transactions: [],
            sign: { value: false },
          }),
        ),
      ).toThrow('Invalid boolean value for argument sign. Value: [object Object]');
    });
  });

  describe('bigint params', () => {
    it('parses canonical decimal strings and safe numbers as bigint params', () => {
      expect(
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '9007199254740993',
            fee: 1,
            address: 'txch1address',
          }),
        ),
      ).toMatchObject({
        amount: 9_007_199_254_740_993n,
        fee: 1n,
      });
    });

    it('rejects bigint params with unsupported types', () => {
      expect(() =>
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: { value: '1' },
            fee: '0',
            address: 'txch1address',
          }),
        ),
      ).toThrow('Invalid bigint value for argument amount. Value: [object Object]');
    });

    it('rejects numeric bigint params that are not safe integers', () => {
      expect(() =>
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: 1.5,
            fee: '0',
            address: 'txch1address',
          }),
        ),
      ).toThrow('Invalid bigint value for argument amount. Value: 1.5');
    });

    it('rejects blank bigint strings before BigInt conversion', () => {
      expect(() =>
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '   ',
            fee: '0',
            address: 'txch1address',
          }),
        ),
      ).toThrow('Invalid bigint value for argument amount. Value:    ');
    });

    it('rejects non-canonical bigint strings', () => {
      expect(() =>
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '01',
            fee: '0',
            address: 'txch1address',
          }),
        ),
      ).toThrow('Invalid bigint value for argument amount. Value: 01');

      expect(() =>
        parseDappParams(
          'chia_sendTransaction',
          serialize({
            amount: '1.5',
            fee: '0',
            address: 'txch1address',
          }),
        ),
      ).toThrow('Cannot convert 1.5 to a BigInt');
    });

    it('accepts large bare JSON integer values as native bigint without precision loss', () => {
      expect(
        parseDappParams('chia_sendTransaction', '{"amount":9007199254740993,"fee":"0","address":"txch1address"}'),
      ).toMatchObject({
        amount: 9_007_199_254_740_993n,
        fee: 0n,
        address: 'txch1address',
      });
    });
  });

  describe('json params', () => {
    it('preserves nested offer and driver keys for create offer params', () => {
      const assetId = '0fbdb7f21392f248f4ce3f8b1497496f056db6eb3856990ea3f697e28ec082c4';

      expect(
        parseDappParams(
          'chia_createOfferForIds',
          serialize({
            offer: {
              1: '-100',
              6: '2323000',
              [assetId]: '1',
            },
            driverDict: {
              [assetId]: {
                innerPuzzleHash: '0x1234',
              },
            },
          }),
        ),
      ).toMatchObject({
        offer: {
          1: '-100',
          6: '2323000',
          [assetId]: '1',
        },
        driver_dict: {
          [assetId]: {
            innerPuzzleHash: '0x1234',
          },
        },
      });
    });
  });

  describe('malformed payloads', () => {
    it('rejects malformed JSON strings', () => {
      expect(() => parseDappParams('chia_getWallets', '{not-json')).toThrow();
    });

    it('rejects primitive JSON payloads before dispatch', () => {
      expect(() => parseDappParams('chia_getWallets', 'null')).toThrow();
      expect(() => parseDappParams('chia_getWallets', '1')).toThrow();
      expect(() => parseDappParams('chia_getWallets', '"string"')).toThrow();
    });
  });
});
