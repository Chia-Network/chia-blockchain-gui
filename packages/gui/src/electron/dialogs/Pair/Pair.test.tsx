import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Pair, { type PairProps } from './Pair';

function inputHasChecked(html: string, field: string): boolean {
  const match = html.match(
    new RegExp(
      `<input[^>]*data-form-field="${field}"[^>]*>|<input[^>]*checked=""[^>]*data-form-field="${field}"[^>]*>`,
    ),
  );
  return !!match?.[0]?.includes('checked=""');
}

function renderPair(overrides: Partial<PairProps> = {}) {
  return renderToStaticMarkup(
    <Pair
      confirmId="confirm"
      metadata={{ name: 'Test Dapp', url: 'https://example.com' }}
      availableWallets={[{ fingerprint: 123, name: 'Wallet 123' }]}
      commandGroups={{
        innocuous: [],
        balance: [],
        sign: [],
        notifications: [],
        spending: [],
        other: [],
      }}
      {...overrides}
    />,
  );
}

describe('Pair dialog - spending allowance defaults', () => {
  it('starts new pairings with auto-approve unchecked but a 0.01 XCH suggested value', () => {
    const html = renderPair();
    expect(html).toContain('data-form-field="enableAllowance"');
    expect(inputHasChecked(html, 'enableAllowance')).toBe(false);
    expect(html).toContain('data-form-field="allowanceXch"');
    expect(html).toContain('value="0.01"');
  });

  it('checks auto-approve and shows the existing allowance for edit/default grants', () => {
    const html = renderPair({ defaultGrants: { xchMojos: '2500000000' } });
    expect(inputHasChecked(html, 'enableAllowance')).toBe(true);
    expect(html).toContain('value="0.0025"');
  });
});

describe('Pair dialog - per-command groups', () => {
  it('renders spending commands separately from other commands', () => {
    const html = renderPair({
      commandGroups: {
        innocuous: [],
        balance: [],
        sign: [],
        notifications: [],
        spending: ['chia_sendTransaction'],
        other: ['chia_logIn'],
      },
    });

    expect(html).toContain('Spending commands');
    expect(html).toContain('Send Transaction');
    expect(html).toContain('Other commands');
    expect(html).toContain('Log In');
  });

  it('pre-checks command-level bypass entries, including spend commands', () => {
    // Per-command bypass uses the multi-checkbox pattern: each box shares
    // `data-form-field="bypass"` with `data-multi`, and its own value=wcCommand.
    // The form scraper collects checked values into `result.bypass: string[]`.
    const html = renderPair({
      defaultBypass: ['chia_sendTransaction'],
      commandGroups: {
        innocuous: [],
        balance: [],
        sign: [],
        notifications: [],
        spending: ['chia_sendTransaction'],
        other: [],
      },
    });

    const match = html.match(/<input[^>]*data-form-field="bypass"[^>]*value="chia_sendTransaction"[^>]*\/?>/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('data-multi');
    expect(match![0]).toContain('checked=""');
  });
});
