// dappEnrichment hits the WebSocket bridge for offer/CAT lookups, so we
// stub the public helpers. The real implementation has try/catch fallbacks
// returning undefined when the bridge is unavailable, but explicit mocks
// let us pin enrichment-driven behavior (like the fee-dedup) deterministically.
jest.mock('../../utils/dappEnrichment', () => {
  const actual = jest.requireActual('../../utils/dappEnrichment');
  return {
    ...actual,
    lookupCat: jest.fn(async () => undefined),
    buildCreateOfferDisplay: jest.fn(async () => undefined),
    buildTakeOfferDisplay: jest.fn(async () => undefined),
  };
});

import { SCHEMA_COMMANDS, getCommandSchema } from '../../constants/commandRegistry';
import { buildCreateOfferDisplay, buildTakeOfferDisplay } from '../../utils/dappEnrichment';

import { renderConfirm } from './renderConfirm';

const mockBuildCreateOfferDisplay = buildCreateOfferDisplay as jest.MockedFunction<typeof buildCreateOfferDisplay>;
const mockBuildTakeOfferDisplay = buildTakeOfferDisplay as jest.MockedFunction<typeof buildTakeOfferDisplay>;

describe('renderConfirm', () => {
  it('renders send_transaction with amount + fee + address in network units', async () => {
    const result = await renderConfirm(
      'chia_wallet.send_transaction',
      { address: 'txch1abc', amount: '1000000000000', fee: '500000000000' },
      { networkPrefix: 'txch' },
    );
    expect(result.title).toBe('Confirm Send Transaction');
    expect(result.confirmLabel).toBe('Send');
    expect(result.destructive).toBe(false);
    expect(result.rows).toEqual([
      { field: 'amount', label: 'Amount', value: '1 TXCH' },
      { field: 'fee', label: 'Fee', value: '0.5 TXCH' },
      { field: 'address', label: 'Address', value: 'txch1abc' },
    ]);
  });

  it('drops rows whose schema param has `hide: true` even when data supplies a value', async () => {
    const result = await renderConfirm(
      'chia_wallet.send_transaction',
      {
        amount: '1000000000000',
        fee: '0',
        address: 'txch1abc',
        wallet_id: 7,
        memos: ['note'],
      },
      { networkPrefix: 'txch' },
    );
    const fields = result.rows.map((r) => r.field);
    expect(fields).not.toContain('wallet_id');
    expect(fields).not.toContain('memos');
  });

  it('skips rows whose data field is undefined / null / empty string', async () => {
    const result = await renderConfirm(
      'chia_wallet.send_transaction',
      { address: 'txch1abc' /* amount and fee absent */ },
      { networkPrefix: 'xch' },
    );
    expect(result.rows.map((r) => r.field)).toEqual(['address']);
  });

  it('renders bool kind as Yes/No', async () => {
    const result = await renderConfirm(
      'chia_wallet.set_auto_claim',
      { enabled: true, tx_fee: '1', min_amount: '0' },
      { networkPrefix: 'xch' },
    );
    const enabled = result.rows.find((r) => r.field === 'enabled');
    expect(enabled?.value).toBe('Yes');

    const result2 = await renderConfirm(
      'chia_wallet.set_auto_claim',
      { enabled: false, tx_fee: '1', min_amount: '0' },
      { networkPrefix: 'xch' },
    );
    const enabled2 = result2.rows.find((r) => r.field === 'enabled');
    expect(enabled2?.value).toBe('No');
  });

  it('marks delete_key destructive and uses the Delete button label', async () => {
    const result = await renderConfirm('chia_wallet.delete_key', { fingerprint: '1234567890' }, {});
    expect(result.destructive).toBe(true);
    expect(result.confirmLabel).toBe('Delete');
    expect(result.rows).toEqual([{ field: 'fingerprint', label: 'Fingerprint', value: '1234567890' }]);
  });

  it('falls back to default schema for unknown commands', async () => {
    const result = await renderConfirm('totally.unknown_command', { foo: 'bar' }, {});
    expect(result.title).toBe('Confirm');
    expect(result.message).toBe('Please review and confirm this action.');
    expect(result.confirmLabel).toBe('Proceed');
    expect(result.destructive).toBe(false);
    expect(result.rows).toEqual([]);
  });

  it('renders sign_message_by_address with the message body', async () => {
    const result = await renderConfirm(
      'chia_wallet.sign_message_by_address',
      { address: 'txch1abc', message: 'hello world' },
      {},
    );
    expect(result.title).toBe('Confirm Sign Message');
    expect(result.confirmLabel).toBe('Sign');
    expect(result.rows).toEqual([
      { field: 'address', label: 'Address', value: 'txch1abc' },
      { field: 'message', label: 'Message', value: 'hello world' },
    ]);
  });

  it('renders open_connection with host + port as text', async () => {
    const result = await renderConfirm('chia_full_node.open_connection', { host: 'node.example.com', port: 8444 }, {});
    expect(result.confirmLabel).toBe('Connect');
    expect(result.rows).toEqual([
      { field: 'host', label: 'Host', value: 'node.example.com' },
      { field: 'port', label: 'Port', value: '8444' },
    ]);
  });

  it('renders close_connection as destructive Disconnect with no rows', async () => {
    const result = await renderConfirm('chia_full_node.close_connection', {}, {});
    expect(result.destructive).toBe(true);
    expect(result.confirmLabel).toBe('Disconnect');
    expect(result.rows).toEqual([]);
  });

  it('renders cancel_offer as destructive with fee in XCH', async () => {
    const result = await renderConfirm('chia_wallet.cancel_offer', { fee: '100000000000' }, { networkPrefix: 'xch' });
    expect(result.destructive).toBe(true);
    expect(result.rows).toEqual([{ field: 'fee', label: 'Fee', value: '0.1 XCH' }]);
  });

  it('renders nft_transfer_nft with target_address + fee', async () => {
    const result = await renderConfirm(
      'chia_wallet.nft_transfer_nft',
      { target_address: 'txch1xyz', fee: '50000000000' },
      { networkPrefix: 'xch' },
    );
    expect(result.title).toBe('Confirm NFT Transfer');
    expect(result.confirmLabel).toBe('Transfer');
    expect(result.rows).toEqual([
      { field: 'target_address', label: 'Target Address', value: 'txch1xyz' },
      { field: 'fee', label: 'Fee', value: '0.05 XCH' },
    ]);
  });

  it('returns an empty display when the schema declares no enrich hook', async () => {
    const result = await renderConfirm(
      'chia_wallet.send_transaction',
      { address: 'txch1abc', amount: '1', fee: '0' },
      {},
    );
    expect(result.display).toEqual({});
  });

  it('cat_spend reads `address` directly (no rename of dapp payload)', async () => {
    const result = await renderConfirm(
      'chia_wallet.cat_spend',
      // Dapp sends the WC param `address`, not `inner_address`. Main shows
      // exactly what the dapp sent on the wire — no renaming.
      { wallet_id: 1, address: 'txch1abc', amount: '100', fee: '0' },
      { networkPrefix: 'xch' },
    );
    const row = result.rows.find((r) => r.field === 'address');
    expect(row?.value).toBe('txch1abc');
    expect(result.rows.find((r) => r.field === 'inner_address')).toBeUndefined();
  });

  it('nft_set_nft_did reads `did` directly (no rename to did_id)', async () => {
    const result = await renderConfirm(
      'chia_wallet.nft_set_nft_did',
      { wallet_id: 1, did: 'did:chia:abc', fee: '0' },
      {},
    );
    const row = result.rows.find((r) => r.field === 'did');
    expect(row?.value).toBe('did:chia:abc');
    expect(result.rows.find((r) => r.field === 'did_id')).toBeUndefined();
  });

  it('json kind pretty-prints an object', async () => {
    const result = await renderConfirm('chia_wallet.spend_clawback_coins', { coin_ids: ['0x1', '0x2'], fee: '0' }, {});
    const row = result.rows.find((r) => r.field === 'coin_ids');
    expect(row?.value).toBe('[\n  "0x1",\n  "0x2"\n]');
  });

  it('renders show_notification announcement with message + url', async () => {
    const result = await renderConfirm(
      'chia_app.show_notification',
      { type: 'announcement', message: 'Hello world', url: 'https://example.com' },
      {},
    );
    expect(result.title).toBe('Confirm Notification');
    expect(result.confirmLabel).toBe('Show');
    expect(result.rows).toEqual([
      { field: 'type', label: 'Type', value: 'announcement' },
      { field: 'message', label: 'Message', value: 'Hello world' },
      { field: 'url', label: 'URL', value: 'https://example.com' },
    ]);
    // No offer enrichment — type is announcement, not offer.
    expect(result.display).toEqual({});
  });

  it('renders show_notification announcement with all_fingerprints flag', async () => {
    const result = await renderConfirm(
      'chia_app.show_notification',
      { type: 'announcement', message: 'Hi', all_fingerprints: true },
      {},
    );
    const all = result.rows.find((r) => r.field === 'all_fingerprints');
    expect(all?.value).toBe('Yes');
  });

  it('show_notification with no offer_data skips offer enrichment', async () => {
    // enrich short-circuits before `buildTakeOfferDisplay` runs.
    const result = await renderConfirm('chia_app.show_notification', { type: 'offer' }, {});
    expect(result.display).toEqual({});
  });

  it('sign_message_by_address surfaces is_hex and safe_mode bool rows', async () => {
    const result = await renderConfirm(
      'chia_wallet.sign_message_by_address',
      { address: 'txch1', message: 'hi', is_hex: false, safe_mode: false },
      {},
    );
    const fields = result.rows.map((r) => r.field);
    expect(fields).toContain('is_hex');
    expect(fields).toContain('safe_mode');
    expect(result.rows.find((r) => r.field === 'safe_mode')?.value).toBe('No');
  });
});

// Walk every schema and assert basic invariants. This catches mistakes where
// a schema forgets a label/title/confirmLabel, references a kind that the
// renderer doesn't handle, or declares a param whose name conflicts with how
// the daemon would receive the field.
describe('renderConfirm — every schema', () => {
  it.each(SCHEMA_COMMANDS)('renders %s with empty data without throwing', async (command) => {
    const result = await renderConfirm(command, {}, { networkPrefix: 'xch' });
    expect(typeof result.title).toBe('string');
    expect(result.title.length).toBeGreaterThan(0);
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
    expect(typeof result.confirmLabel).toBe('string');
    expect(result.confirmLabel.length).toBeGreaterThan(0);
    expect(typeof result.destructive).toBe('boolean');
    // Empty data → no rows render (every isPresent check fails). For schemas
    // with no params at all, `rows` is also empty.
    expect(Array.isArray(result.rows)).toBe(true);
  });

  it.each(SCHEMA_COMMANDS)('schema for %s has unique param names', (command) => {
    const schema = getCommandSchema(command);
    const names = schema.params.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it.each(SCHEMA_COMMANDS)('schema for %s only declares known param types', (command) => {
    const schema = getCommandSchema(command);
    const known = new Set(['text', 'mojo-to-xch', 'mojo-to-cat', 'bool', 'json']);
    for (const param of schema.params) {
      expect(known.has(param.type)).toBe(true);
    }
  });
});

describe('renderConfirm — offer fee dedup', () => {
  // Fix for the "fee shown twice" bug on Confirm Create Offer / Take Offer:
  // the schema's fee param row and the offer enrichment card both rendered
  // it. The card is the canonical place; the row is suppressed.
  beforeEach(() => {
    mockBuildCreateOfferDisplay.mockReset();
    mockBuildTakeOfferDisplay.mockReset();
  });

  it('drops the fee row from create_offer_for_ids when offer enrichment carries the fee', async () => {
    mockBuildCreateOfferDisplay.mockResolvedValue({ offered: [], requested: [], fee: '0' });

    const result = await renderConfirm(
      'chia_wallet.create_offer_for_ids',
      { fee: '500000000000', validate_only: false },
      { networkPrefix: 'xch' },
    );

    expect(result.rows.find((r) => r.field === 'fee')).toBeUndefined();
    expect(result.display.offer?.fee).toBe('0');
  });

  it('keeps the fee row when enrichment fails to produce a display (no offer card)', async () => {
    // If the daemon RPC for offer summary times out, enrichment returns
    // undefined → no offer card rendered → fee row must stay so the user
    // still sees what they're paying.
    mockBuildCreateOfferDisplay.mockResolvedValue(undefined);

    const result = await renderConfirm(
      'chia_wallet.create_offer_for_ids',
      { fee: '500000000000', validate_only: false },
      { networkPrefix: 'xch' },
    );

    const feeRow = result.rows.find((r) => r.field === 'fee');
    expect(feeRow?.value).toBe('0.5 XCH');
    expect(result.display.offer).toBeUndefined();
  });

  it('keeps the fee row when offer enrichment exists but has no fee field', async () => {
    // Defensive: some future enrichment shape might omit fee. Still surface
    // the param row so the value isn't lost.
    mockBuildCreateOfferDisplay.mockResolvedValue({ offered: [], requested: [] });

    const result = await renderConfirm(
      'chia_wallet.create_offer_for_ids',
      { fee: '500000000000', validate_only: false },
      { networkPrefix: 'xch' },
    );

    const feeRow = result.rows.find((r) => r.field === 'fee');
    expect(feeRow?.value).toBe('0.5 XCH');
  });

  it('drops the fee row from take_offer when offer enrichment carries the fee', async () => {
    mockBuildTakeOfferDisplay.mockResolvedValue({ offered: [], requested: [], fee: '0' });

    const result = await renderConfirm(
      'chia_wallet.take_offer',
      { fee: '0', offer: 'offer1abc...' },
      { networkPrefix: 'xch' },
    );

    expect(result.rows.find((r) => r.field === 'fee')).toBeUndefined();
    expect(result.display.offer?.fee).toBe('0');
  });

  it('preserves non-fee rows when fee is dropped (only fee is suppressed)', async () => {
    mockBuildCreateOfferDisplay.mockResolvedValue({ offered: [], requested: [], fee: '0' });

    const result = await renderConfirm(
      'chia_wallet.create_offer_for_ids',
      { fee: '500000000000', validate_only: true, allow_unsynced: false },
      { networkPrefix: 'xch' },
    );

    expect(result.rows.find((r) => r.field === 'validate_only')?.value).toBe('Yes');
    expect(result.rows.find((r) => r.field === 'allow_unsynced')?.value).toBe('No');
    expect(result.rows.find((r) => r.field === 'fee')).toBeUndefined();
  });
});
