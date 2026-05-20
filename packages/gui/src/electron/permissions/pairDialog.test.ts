import {
  classifyForPairDialog,
  dialogResultToBypass,
  dialogResultToFingerprints,
  dialogResultToGrants,
} from './pairDialog';

describe('dialogResultToGrants', () => {
  it('stores zero when the allowance checkbox is unchecked, even if the input has a value', () => {
    expect(dialogResultToGrants({ enableAllowance: false, allowanceXch: '0.01' })).toEqual({ xchMojos: '0' });
    expect(dialogResultToGrants({ allowanceXch: '0.01' })).toEqual({ xchMojos: '0' });
  });

  it('converts enabled XCH allowance to whole mojos', () => {
    expect(dialogResultToGrants({ enableAllowance: true, allowanceXch: '0.01' })).toEqual({
      xchMojos: '10000000000',
    });
  });

  it('floors fractional mojos and rejects non-positive or invalid values', () => {
    expect(dialogResultToGrants({ enableAllowance: true, allowanceXch: '0.0000000000019' })).toEqual({
      xchMojos: '1',
    });
    expect(dialogResultToGrants({ enableAllowance: true, allowanceXch: '-1' })).toEqual({ xchMojos: '0' });
    expect(dialogResultToGrants({ enableAllowance: true, allowanceXch: 'oops' })).toEqual({ xchMojos: '0' });
  });
});

describe('dialogResultToBypass', () => {
  it('keeps only the wcCommands that were granted to the pair', () => {
    // The form scraper produces a `bypass` array of values from the checked
    // boxes. Unchecked boxes simply don't appear, so there's no `false` to
    // filter — we just gate on the granted-set.
    expect(
      dialogResultToBypass({ bypass: ['chia_sendTransaction', 'chia_getWallets', 'chia_notGranted'] }, [
        'chia_sendTransaction',
        'chia_takeOffer',
      ]),
    ).toEqual(['chia_sendTransaction']);
  });

  it('returns [] when the bypass field is missing or not an array', () => {
    expect(dialogResultToBypass({}, ['chia_sendTransaction'])).toEqual([]);
    expect(dialogResultToBypass({ bypass: 'chia_sendTransaction' }, ['chia_sendTransaction'])).toEqual([]);
    expect(dialogResultToBypass({ bypass: null }, ['chia_sendTransaction'])).toEqual([]);
  });

  it('skips non-string entries inside the array', () => {
    expect(
      dialogResultToBypass({ bypass: ['chia_sendTransaction', 42, null, true] }, ['chia_sendTransaction']),
    ).toEqual(['chia_sendTransaction']);
  });

  it('drops sign-class commands — `permissions.resolvePermission` always prompts for them, so a persisted bypass would silently no-op', () => {
    expect(
      dialogResultToBypass({ bypass: ['chia_signMessageByAddress', 'chia_signMessageById', 'chia_sendTransaction'] }, [
        'chia_signMessageByAddress',
        'chia_signMessageById',
        'chia_sendTransaction',
      ]),
    ).toEqual(['chia_sendTransaction']);
  });
});

describe('dialogResultToFingerprints', () => {
  it('keeps finite numeric fingerprints only', () => {
    expect(dialogResultToFingerprints({ wallets: ['123', 456, 'bad', Infinity] })).toEqual([123, 456]);
  });

  it('defaults to an empty list for malformed input', () => {
    expect(dialogResultToFingerprints({ wallets: '123' })).toEqual([]);
  });
});

describe('classifyForPairDialog', () => {
  it('groups spend commands separately from other commands', () => {
    expect(
      classifyForPairDialog([
        'chia_getWallets',
        'chia_getWalletBalance',
        'chia_signMessageByAddress',
        'chia_showNotification',
        'chia_sendTransaction',
        'chia_createOfferForIds',
        'chia_takeOffer',
        'chia_pushTransactions',
        'chia_logIn',
      ]),
    ).toEqual({
      innocuous: ['chia_getWallets'],
      balance: ['chia_getWalletBalance'],
      sign: ['chia_signMessageByAddress'],
      notifications: ['chia_showNotification'],
      spending: ['chia_sendTransaction', 'chia_createOfferForIds', 'chia_takeOffer', 'chia_pushTransactions'],
      other: ['chia_logIn'],
    });
  });

  it('ignores unknown commands rather than surfacing impossible toggles', () => {
    expect(classifyForPairDialog(['chia_totallyMadeUp'])).toEqual({
      innocuous: [],
      balance: [],
      sign: [],
      notifications: [],
      spending: [],
      other: [],
    });
  });
});
