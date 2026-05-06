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
  it('keeps only checked commands that were granted to the pair', () => {
    expect(
      dialogResultToBypass(
        {
          'bypass-chia_sendTransaction': true,
          'bypass-chia_getWallets': true,
          'bypass-chia_takeOffer': false,
          'bypass-chia_notGranted': true,
        },
        ['chia_sendTransaction', 'chia_takeOffer'],
      ),
    ).toEqual(['chia_sendTransaction']);
  });

  it('requires literal boolean true', () => {
    expect(dialogResultToBypass({ 'bypass-chia_sendTransaction': 'true' }, ['chia_sendTransaction'])).toEqual([]);
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
