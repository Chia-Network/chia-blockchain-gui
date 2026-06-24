import { type ParamSchema } from './Commands';
import { humanizeParams } from './humanizeParams';

function buildParam(name: string, options: Partial<ParamSchema> = {}): ParamSchema {
  return {
    name,
    label: () => `${name} label`,
    type: 'string',
    ...options,
  };
}

describe('humanizeParams', () => {
  it('returns humanized visible params in schema order with labels', async () => {
    const params = [
      buildParam('address', { label: () => 'Address' }),
      buildParam('wallet_id', {
        hide: true,
        label: () => {
          throw new Error('hidden label should not be called');
        },
      }),
      buildParam('fee', { label: () => 'Fee', humanize: 'mojo-to-xch', type: 'bigint' }),
      buildParam('memo', {
        isOptional: true,
        label: () => {
          throw new Error('omitted optional label should not be called');
        },
      }),
    ];
    const data = {
      wallet_id: 1,
      fee: 10n,
      address: 'txch1address',
    };

    await expect(humanizeParams(params, data, 'txch')).resolves.toEqual([
      {
        field: 'address',
        label: 'Address',
        value: 'txch1address',
      },
      {
        field: 'fee',
        label: 'Fee',
        value: '0.00000000001 TXCH',
      },
    ]);
  });

  it('shows required missing params and optional params explicitly provided as undefined', async () => {
    const params = [
      buildParam('required_missing', { type: 'number' }),
      buildParam('optional_missing', { isOptional: true }),
      buildParam('optional_undefined', { isOptional: true }),
    ];
    const data = {
      optional_undefined: undefined,
    };

    await expect(humanizeParams(params, data)).resolves.toEqual([
      {
        field: 'required_missing',
        label: 'required_missing label',
        value: 'Not provided',
      },
      {
        field: 'optional_undefined',
        label: 'optional_undefined label',
        value: 'Not provided',
      },
    ]);
  });

  it('propagates formatter errors instead of hiding invalid confirmation data', async () => {
    const params = [buildParam('amount', { type: 'bigint' })];
    const data = { amount: 'not-a-bigint' };

    await expect(humanizeParams(params, data)).rejects.toThrow('Cannot convert not-a-bigint to a BigInt');
  });
});
