/**
 * `dappEnrichment` builds the offer-summary card shown in the Confirm
 * dialog from the daemon's response. Trust boundary: it lives in main and
 * is what the user actually sees, so type-detection regressions here can
 * mislabel an NFT as a CAT (or worse, hide an NFT image entirely — that's
 * the bug these tests pin against).
 */

jest.mock('./webSocketBridge');

import { sendDappAndAwait } from './webSocketBridge';

import { buildCreateOfferDisplay, buildTakeOfferDisplay, lookupCat } from './dappEnrichment';

const mockSendDappAndAwait = sendDappAndAwait as jest.MockedFunction<typeof sendDappAndAwait>;

type DaemonHandler = (data: Record<string, unknown>) => Record<string, unknown>;

// Route by destination.command to a handler. Each handler returns the
// camelCase shape `data` should have on the response. The daemon's wire
// shape is snake_case but `callDaemon` runs toCamelCase on its way back,
// so we hand back the post-conversion shape directly.
function setupDaemonMock(handlers: Record<string, DaemonHandler>) {
  mockSendDappAndAwait.mockImplementation(async (_requestId, payload) => {
    const wire = JSON.parse(payload) as { destination: string; command: string; data?: Record<string, unknown> };
    const key = `${wire.destination}.${wire.command}`;
    const handler = handlers[key];
    if (!handler) {
      throw new Error(`unmocked daemon call: ${key}`);
    }
    return { data: handler(wire.data ?? {}) };
  });
}

beforeEach(() => {
  mockSendDappAndAwait.mockReset();
});

describe('buildTakeOfferDisplay — NFT detection (regression: was misrendered as CAT)', () => {
  it('renders an NFT being offered with kind=nft and the https previewUrl from nft_get_info', async () => {
    // Pre-fix bug: info.type === 'NFT' check; daemon emits 'singleton',
    // so NFTs fell through to the CAT branch (no image, wrong amount label).
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { '0xabc123': 1 },
          requested: { xch: '1123000000000' },
          infos: {
            '0xabc123': { type: 'singleton', launcherId: '0xabc123' },
          },
        },
      }),
      'chia_wallet.nft_get_info': () => ({
        nftInfo: { dataUris: ['https://example.com/nft.png'] },
      }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });

    expect(display?.offered).toHaveLength(1);
    expect(display?.offered[0]).toMatchObject({
      kind: 'nft',
      previewUrl: 'https://example.com/nft.png',
    });
  });

  it('renders an NFT in the requested side too (when the user is taking-to-receive)', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { xch: '1000000000000' },
          requested: { '0xdef456': 1 },
          infos: {
            '0xdef456': { type: 'singleton', launcherId: '0xdef456' },
          },
        },
      }),
      'chia_wallet.nft_get_info': () => ({ nftInfo: { dataUris: ['https://example.com/got.png'] } }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });

    expect(display?.requested).toHaveLength(1);
    expect(display?.requested[0]).toMatchObject({ kind: 'nft', previewUrl: 'https://example.com/got.png' });
  });

  it('rejects an http:// dataUri (isValidURL only accepts https + ipfs)', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { '0xabc': 1 },
          requested: { xch: '1' },
          infos: { '0xabc': { type: 'singleton', launcherId: '0xabc' } },
        },
      }),
      'chia_wallet.nft_get_info': () => ({ nftInfo: { dataUris: ['http://insecure.example.com/x.png'] } }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });
    expect(display?.offered[0]).toMatchObject({ kind: 'nft' });
    expect((display?.offered[0] as { previewUrl?: string }).previewUrl).toBeUndefined();
  });

  it('picks the first dataUri that passes isValidURL when an invalid URL is listed first', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { '0xabc': 1 },
          requested: { xch: '1' },
          infos: { '0xabc': { type: 'singleton', launcherId: '0xabc' } },
        },
      }),
      'chia_wallet.nft_get_info': () => ({
        nftInfo: { dataUris: ['http://insecure.example.com/x.png', 'https://secure.example.com/x.png'] },
      }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });
    expect((display?.offered[0] as { previewUrl?: string }).previewUrl).toBe('https://secure.example.com/x.png');
  });

  it('omits previewUrl when nft_get_info returns no dataUris', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { '0xabc123': 1 },
          requested: { xch: '1' },
          infos: { '0xabc123': { type: 'singleton', launcherId: '0xabc123' } },
        },
      }),
      'chia_wallet.nft_get_info': () => ({ nftInfo: {} }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });

    expect(display?.offered[0]).toMatchObject({ kind: 'nft' });
    expect((display?.offered[0] as { previewUrl?: string }).previewUrl).toBeUndefined();
  });

  it('omits previewUrl when nft_get_info fails (caller still gets a kind=nft line)', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { '0xabc123': 1 },
          requested: { xch: '1' },
          infos: { '0xabc123': { type: 'singleton', launcherId: '0xabc123' } },
        },
      }),
      'chia_wallet.nft_get_info': () => {
        throw new Error('rpc down');
      },
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });

    expect(display?.offered[0]).toMatchObject({ kind: 'nft' });
  });
});

describe('buildTakeOfferDisplay — CAT, XCH, and mixed', () => {
  it('renders a CAT entry with assetId + symbol from cat_asset_id_to_name', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { '0xcat789': 1000 },
          requested: { xch: '1000000000000' },
          infos: { '0xcat789': { type: 'CAT', tail: '0xcat789' } },
        },
      }),
      // Wire is snake_case (post-toSnakeCase); handler reads `asset_id`.
      'chia_wallet.cat_asset_id_to_name': (data) => ({ name: data.asset_id === '0xcat789' ? 'TEST' : undefined }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });

    expect(display?.offered[0]).toMatchObject({ kind: 'cat', assetId: '0xcat789', symbol: 'TEST' });
  });

  it('falls back to no symbol when cat_asset_id_to_name fails', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { '0xcat789': 1000 },
          requested: { xch: '1' },
          infos: { '0xcat789': { type: 'CAT' } },
        },
      }),
      'chia_wallet.cat_asset_id_to_name': () => {
        throw new Error('not in registry');
      },
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });
    expect((display?.offered[0] as { symbol?: string }).symbol).toBeUndefined();
  });

  it('renders an XCH entry without consulting infos', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { xch: '500000000000' },
          requested: { xch: '1000000000000' },
          infos: {},
        },
      }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });
    expect(display?.offered[0]).toMatchObject({ kind: 'xch' });
    expect(display?.requested[0]).toMatchObject({ kind: 'xch' });
  });

  it('handles a mixed offer (NFT for XCH + CAT)', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { '0xnft111': 1 },
          requested: { xch: '1000000000000', '0xcat222': 100 },
          infos: {
            '0xnft111': { type: 'singleton', launcherId: '0xnft111' },
            '0xcat222': { type: 'CAT' },
          },
        },
      }),
      'chia_wallet.nft_get_info': () => ({ nftInfo: { dataUris: ['https://example.com/n.png'] } }),
      'chia_wallet.cat_asset_id_to_name': () => ({ name: 'CAT' }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });
    const kinds = (lines: typeof display.offered) => lines.map((l) => l.kind);

    expect(kinds(display!.offered)).toEqual(['nft']);
    expect(kinds(display!.requested).sort()).toEqual(['cat', 'xch']);
  });

  it('threads the dapp-supplied fee through (in XCH, not mojos)', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({
        summary: {
          offered: { xch: '1' },
          requested: { xch: '2' },
          infos: {},
        },
      }),
    });

    const display = await buildTakeOfferDisplay({ offer: 'offer1...', fee: '500000000000' });
    expect(display?.fee).toBe('0.5');
  });
});

describe('buildTakeOfferDisplay — input validation', () => {
  it('returns undefined when `offer` is missing', async () => {
    const display = await buildTakeOfferDisplay({});
    expect(display).toBeUndefined();
    expect(mockSendDappAndAwait).not.toHaveBeenCalled();
  });

  it('returns undefined when `offer` is the wrong type', async () => {
    const display = await buildTakeOfferDisplay({ offer: 42 });
    expect(display).toBeUndefined();
    expect(mockSendDappAndAwait).not.toHaveBeenCalled();
  });

  it('returns undefined when get_offer_summary fails', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => {
        throw new Error('invalid offer');
      },
    });
    const display = await buildTakeOfferDisplay({ offer: 'broken' });
    expect(display).toBeUndefined();
  });

  it('returns undefined when summary shape is malformed', async () => {
    setupDaemonMock({
      'chia_wallet.get_offer_summary': () => ({ summary: 'not-an-object' }),
    });
    const display = await buildTakeOfferDisplay({ offer: 'offer1...' });
    expect(display).toBeUndefined();
  });
});

describe('buildCreateOfferDisplay — already-working NFT path stays working', () => {
  it('treats a non-numeric hex key as an NFT launcher id', async () => {
    // Numeric keys = wallet ids; non-numeric = hex launcher id. Belt-and-
    // suspenders test against the create-offer regression where my fix to
    // the take-offer side could conceivably also affect create.
    setupDaemonMock({
      'chia_wallet.get_wallets': () => ({ wallets: [] }),
      'chia_wallet.nft_get_info': () => ({ nftInfo: { dataUris: ['https://example.com/owned.png'] } }),
    });

    const display = await buildCreateOfferDisplay({
      offer: { '0xlauncher123': -1 },
    });

    expect(display?.offered).toHaveLength(1);
    expect(display?.offered[0]).toMatchObject({ kind: 'nft', previewUrl: 'https://example.com/owned.png' });
  });

  it('classifies a numeric STANDARD_WALLET key as XCH', async () => {
    setupDaemonMock({
      'chia_wallet.get_wallets': () => ({ wallets: [{ id: 1, type: 0 /* STANDARD_WALLET */ }] }),
    });

    const display = await buildCreateOfferDisplay({ offer: { '1': -1000000000000 } });
    expect(display?.offered[0]).toMatchObject({ kind: 'xch' });
  });

  it('classifies a numeric CAT key as CAT', async () => {
    setupDaemonMock({
      'chia_wallet.get_wallets': () => ({
        wallets: [{ id: 2, type: 6 /* CAT */, name: 'My CAT', meta: { assetId: '0xcat' } }],
      }),
      'chia_wallet.cat_asset_id_to_name': () => ({ name: 'TEST' }),
    });

    const display = await buildCreateOfferDisplay({ offer: { '2': -1000 } });
    expect(display?.offered[0]).toMatchObject({ kind: 'cat', assetId: '0xcat', symbol: 'TEST' });
  });

  it('returns undefined when `offer` is not an object', async () => {
    expect(await buildCreateOfferDisplay({})).toBeUndefined();
    expect(await buildCreateOfferDisplay({ offer: null })).toBeUndefined();
    expect(await buildCreateOfferDisplay({ offer: 'string' })).toBeUndefined();
  });
});

describe('lookupCat', () => {
  it('returns the resolved displayName + isRevocable=false for a regular CAT', async () => {
    setupDaemonMock({
      'chia_wallet.get_wallets': () => ({
        wallets: [{ id: 5, type: 6 /* CAT */, name: 'My CAT', meta: { assetId: '0xa1' } }],
      }),
      'chia_wallet.cat_asset_id_to_name': () => ({ name: 'TEST' }),
    });

    const result = await lookupCat(5);
    expect(result).toEqual({ displayName: 'TEST', isRevocable: false });
  });

  it('flags isRevocable=true for an RCAT', async () => {
    setupDaemonMock({
      'chia_wallet.get_wallets': () => ({
        wallets: [{ id: 5, type: 132 /* RCAT */, name: 'Restricted', meta: { assetId: '0xa1' } }],
      }),
      'chia_wallet.cat_asset_id_to_name': () => ({ name: 'RCAT' }),
    });

    const result = await lookupCat(5);
    expect(result).toEqual({ displayName: 'RCAT', isRevocable: true });
  });

  it('falls back to the wallet name when the CAT registry has no match', async () => {
    setupDaemonMock({
      'chia_wallet.get_wallets': () => ({
        wallets: [{ id: 5, type: 6, name: 'My CAT', meta: { assetId: '0xa1' } }],
      }),
      'chia_wallet.cat_asset_id_to_name': () => {
        throw new Error('not in registry');
      },
    });

    const result = await lookupCat(5);
    expect(result?.displayName).toBe('My CAT');
  });

  it('returns undefined for a non-CAT wallet (e.g. STANDARD_WALLET)', async () => {
    setupDaemonMock({
      'chia_wallet.get_wallets': () => ({
        wallets: [{ id: 1, type: 0 /* STANDARD_WALLET */, name: 'XCH' }],
      }),
    });

    expect(await lookupCat(1)).toBeUndefined();
  });

  it('returns undefined when the wallet id does not exist', async () => {
    setupDaemonMock({
      'chia_wallet.get_wallets': () => ({ wallets: [{ id: 1, type: 0 }] }),
    });

    expect(await lookupCat(999)).toBeUndefined();
  });

  it('returns undefined when get_wallets fails', async () => {
    setupDaemonMock({
      'chia_wallet.get_wallets': () => {
        throw new Error('daemon down');
      },
    });

    expect(await lookupCat(5)).toBeUndefined();
  });
});
