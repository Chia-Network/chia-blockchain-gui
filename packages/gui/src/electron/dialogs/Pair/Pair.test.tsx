import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Pair, { type PairProps } from './Pair';

function inputHasChecked(html: string, field: string, value?: string): boolean {
  const valueClause = value ? `[^>]*value="${value}"` : '';
  const match = html.match(
    new RegExp(
      `<input[^>]*data-form-field="${field}"${valueClause}[^>]*>|<input[^>]*checked=""[^>]*data-form-field="${field}"${valueClause}[^>]*>`,
    ),
  );
  return !!match?.[0]?.includes('checked=""');
}

const defaultPair: NonNullable<PairProps['pair']> = {
  topic: 'topic-1',
  mainnet: true,
  metadata: { name: 'Test Dapp', url: 'https://example.com' },
  fingerprints: [123],
  createdAt: 0,
  updatedAt: 0,
  grants: { xchMojos: '0' },
  usedMojos: '0',
  commands: [],
  bypass: [],
};

function renderPair(overrides: Partial<PairProps> = {}) {
  return renderToStaticMarkup(
    <Pair
      confirmId="confirm"
      metadata={{ name: 'Test Dapp', url: 'https://example.com' }}
      keys={[{ fingerprint: 123, public_key: 'pk', label: 'Wallet 123' }]}
      commands={[]}
      currentFingerprint={123}
      {...overrides}
    />,
  );
}

describe('Pair dialog - wallet keys', () => {
  it('shows available wallet keys for a new pairing', () => {
    const html = renderPair();
    expect(html).toContain('Wallet 123');
    expect(html).toContain('data-chip-for="fingerprint"');
    expect(html).not.toContain('No wallet keys available.');
  });

  it('shows an empty state when no wallet keys are available', () => {
    const html = renderPair({ keys: [] });
    expect(html).toContain('No wallet keys available.');
  });
});

describe('Pair dialog - per-command groups', () => {
  it('renders spending commands separately from unsupported commands', () => {
    const html = renderPair({
      commands: ['chia_sendTransaction', 'chia_logIn'],
    });

    expect(html).toContain('Spending commands');
    expect(html).toContain('Send Transaction');
    expect(html).toContain('Not supported and excluded');
    expect(html).toContain('chia_logIn');
  });

  it('pre-checks command-level bypass entries', () => {
    const html = renderPair({
      commands: ['chia_getWallets'],
      pair: {
        ...defaultPair,
        commands: ['chia_getWallets'],
        bypass: ['chia_getWallets'],
      },
    });

    const match = html.match(/<input[^>]*data-form-field="bypass"[^>]*value="chia_getWallets"[^>]*\/?>/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('data-multi');
    expect(inputHasChecked(html, 'bypass', 'chia_getWallets')).toBe(true);
  });
});
