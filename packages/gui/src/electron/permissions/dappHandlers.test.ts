import { WcError, WcErrorCode } from '../../@types/WcError';

import { processDispatchResponse } from './dappHandlers';

describe('processDispatchResponse', () => {
  it('returns {} when response is undefined', () => {
    expect(processDispatchResponse(undefined)).toEqual({});
  });

  it('returns {} when response is null', () => {
    expect(processDispatchResponse(null)).toEqual({});
  });

  it('returns {} when response has no data key', () => {
    expect(processDispatchResponse({})).toEqual({});
  });

  it('returns {} when response.data is null', () => {
    expect(processDispatchResponse({ data: null })).toEqual({});
  });

  it('returns camelCased data when response.data has no error key', () => {
    expect(processDispatchResponse({ data: { wallet_id: 1 } })).toEqual({ walletId: 1 });
  });

  it('returns camelCased data when response.data.error is undefined', () => {
    expect(processDispatchResponse({ data: { error: undefined, wallet_id: 2 } })).toEqual({ walletId: 2 });
  });

  it('returns camelCased data when response.data.error is null (falsy)', () => {
    expect(processDispatchResponse({ data: { error: null, wallet_id: 3 } })).toEqual({
      error: null,
      walletId: 3,
    });
  });

  it('returns camelCased data when response.data.error is empty string (falsy)', () => {
    expect(processDispatchResponse({ data: { error: '', wallet_id: 4 } })).toEqual({
      error: '',
      walletId: 4,
    });
  });

  it('throws WcError with INTERNAL_ERROR when response.data.error is truthy', () => {
    const response = {
      data: { error: 'fee too low', success: false, wallet_id: 1 },
    };

    expect(() => processDispatchResponse(response)).toThrow(WcError);

    try {
      processDispatchResponse(response);
    } catch (e) {
      expect(e).toBeInstanceOf(WcError);
      const wcErr = e;
      expect(wcErr.message).toBe('fee too low');
      expect(wcErr.code).toBe(WcErrorCode.INTERNAL_ERROR);
      expect(wcErr.data).toEqual({ error: 'fee too low', success: false, walletId: 1 });
    }
  });
});
