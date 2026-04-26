import React from 'react';

import { i18n } from '../../../config/locales';
import SandboxedIframe from '../../components/SandboxedIframe';
import { Scope, scopeLabel } from '../../constants/WalletConnectScopeMap';
import mojoToCATLocaleString from '../../utils/mojoToCATLocaleString';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';

export type SpendDialogResult = {
  confirmed: boolean;
  upgradeBudget?: {
    maxPerTx?: string;
    maxPerWindow?: string;
    windowSeconds?: number;
    maxFeePerTx?: string;
    expiresAt?: number;
  };
};

export type WalletConnectSpendProps = {
  confirmId: string;
  nsCommand: string;
  scope: Scope;
  amount: string;
  fee: string;
  kind: 'xch' | 'cat' | 'mixed';
  catAmounts?: Record<string, string>;
  txCount: number;
  dappName?: string;
  dappUrl?: string;
  currentPolicy: 'block' | 'ask' | 'allow';
  rawData?: unknown;
  styleURL?: string;
  isDarkMode?: boolean;
  // Most recent XCH→USD rate from main-side `usdRate.ts`. Undefined when offline,
  // in which case the dialog hides the fiat row rather than guessing a value.
  usdPerXch?: number;
};

function formatAmount(amount: string, kind: 'xch' | 'cat' | 'mixed'): string {
  try {
    if (kind === 'cat') {
      return mojoToCATLocaleString(amount);
    }
    return `${mojoToChiaLocaleString(amount)} XCH`;
  } catch {
    return amount;
  }
}

const MOJOS_PER_XCH = 1_000_000_000_000n;

function mojosToUsd(mojos: string, usdPerXch: number | undefined): string | undefined {
  if (!usdPerXch || !Number.isFinite(usdPerXch)) return undefined;
  try {
    const m = BigInt(mojos);
    if (m === 0n) return '$0.00';
    // Convert via micro-XCH to keep precision before going to Number.
    const microXch = Number(m * 1_000_000n / MOJOS_PER_XCH) / 1_000_000;
    const usd = microXch * usdPerXch;
    return `$${usd.toFixed(2)}`;
  } catch {
    return undefined;
  }
}

export default function WalletConnectSpend(props: WalletConnectSpendProps) {
  const {
    confirmId,
    nsCommand,
    scope,
    amount,
    fee,
    kind,
    catAmounts,
    txCount,
    dappName,
    dappUrl,
    currentPolicy,
    rawData,
    styleURL,
    isDarkMode,
    usdPerXch,
  } = props;

  const heroAmount = formatAmount(amount, kind);
  const heroFee = `${mojoToChiaLocaleString(fee)} XCH`;
  const amountUsd = kind === 'cat' ? undefined : mojosToUsd(amount, usdPerXch);
  const feeUsd = mojosToUsd(fee, usdPerXch);
  const isZeroAmount = amount === '0';

  return (
    <div className="p-4 flex flex-col h-full text-gray-900 dark:text-gray-100" data-testid="wc-spend">
      <div className="mb-3">
        <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
          {i18n._(/* i18n */ { id: 'WalletConnect Action' })} · {scopeLabel(scope)}
        </p>
        <h2 className="mt-1 mb-0 text-lg font-semibold">
          {dappName || i18n._(/* i18n */ { id: 'Unknown dApp' })}
        </h2>
        {dappUrl && <p className="text-xs text-gray-500 dark:text-gray-400 break-all my-1">{dappUrl}</p>}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-3 bg-gray-50 dark:bg-gray-800">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-0 mb-3">
          {isZeroAmount
            ? i18n._(/* i18n */ { id: 'This request does not spend wallet funds, but may add a transaction fee.' })
            : i18n._(/* i18n */ { id: 'This app is asking to move wallet funds.' })}
        </p>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {i18n._(/* i18n */ { id: 'Amount being spent' })}
          </span>
          <span className="text-2xl font-semibold break-all">{heroAmount}</span>
          {amountUsd && (
            <span className="text-xs text-gray-500 dark:text-gray-400">≈ {amountUsd}</span>
          )}
        </div>
        {catAmounts && Object.keys(catAmounts).length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{i18n._(/* i18n */ { id: 'CAT amounts' })}</span>
            {Object.entries(catAmounts).map(([assetId, amt]) => (
              <span key={assetId} className="text-sm font-mono break-all">
                {assetId.slice(0, 10)}…: {mojoToCATLocaleString(amt)}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {i18n._(/* i18n */ { id: 'Transaction fee' })}
          </span>
          <span className="text-base">
            {heroFee}
            {feeUsd && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">≈ {feeUsd}</span>}
          </span>
        </div>
        {txCount > 1 && (
          <div className="mt-3 flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{i18n._(/* i18n */ { id: 'Transactions' })}</span>
            <span className="text-base">{txCount}</span>
          </div>
        )}
      </div>

      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-200">{i18n._(/* i18n */ { id: 'Command' })}:</span>{' '}
        <span className="font-mono break-all">{nsCommand}</span>
      </div>

      <details className="mb-3">
        <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
          {i18n._(/* i18n */ { id: 'Raw request data' })}
        </summary>
        <div className="mt-2 max-h-40 overflow-auto">
          <SandboxedIframe className="w-full h-40" isDarkMode={isDarkMode}>
            <link href={styleURL} type="text/css" rel="stylesheet" />
            <pre className="text-xs break-all whitespace-pre-wrap p-2">
              {(() => {
                try {
                  return JSON.stringify(rawData, null, 2);
                } catch {
                  return String(rawData);
                }
              })()}
            </pre>
          </SandboxedIframe>
        </div>
      </details>

      <div className="mb-3 p-3 rounded-md border border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {i18n._(/* i18n */ { id: 'Current policy' })}: <strong>{currentPolicy}</strong>
        </span>
        <label className="mt-3 flex items-center gap-2 text-xs">
          <input type="checkbox" id="wc-upgrade-toggle" data-action="toggle-upgrade" />
          <span>
            {i18n._(/* i18n */ { id: 'Allow this dApp to spend up to' })}{' '}
            <input
              id="wc-upgrade-amount"
              type="number"
              step="0.000001"
              min="0"
              defaultValue="1"
              className="w-24 px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />{' '}
            XCH {i18n._(/* i18n */ { id: 'over the next' })}{' '}
            <input
              id="wc-upgrade-window"
              type="number"
              step="1"
              min="1"
              defaultValue="1"
              className="w-16 px-1 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />{' '}
            {i18n._(/* i18n */ { id: 'hour(s) without asking' })}
          </span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {i18n._(
            /* i18n */ {
              id: 'Approving with this option enabled will replace the current Ask policy for this scope with a budgeted Allow policy.',
            },
          )}
        </p>
      </div>

      <div className="flex justify-end gap-3 mt-auto">
        <button
          type="button"
          data-action="cancel"
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {i18n._(/* i18n */ { id: 'Reject' })}
        </button>
        <button
          type="button"
          id={confirmId}
          className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-md hover:bg-green-600"
        >
          {i18n._(/* i18n */ { id: 'Approve' })}
        </button>
      </div>
    </div>
  );
}

export const walletConnectSpendScript = (confirmId: string) => `
  (function () {
    var MOJOS_PER_XCH = BigInt('1000000000000');

    function xchToMojos(value) {
      var s = String(value === undefined || value === null ? '' : value).trim();
      if (s === '') return undefined;
      var parts = s.split('.');
      var whole = parts[0] || '0';
      var frac = (parts[1] || '').slice(0, 12);
      while (frac.length < 12) frac += '0';
      try {
        return (BigInt(whole) * MOJOS_PER_XCH + BigInt(frac)).toString();
      } catch (e) {
        return undefined;
      }
    }

    function readUpgrade() {
      var toggle = document.getElementById('wc-upgrade-toggle');
      if (!toggle || !toggle.checked) return undefined;
      var amountEl = document.getElementById('wc-upgrade-amount');
      var windowEl = document.getElementById('wc-upgrade-window');
      var maxPerWindow = amountEl ? xchToMojos(amountEl.value) : undefined;
      var hours = windowEl && windowEl.value ? Number(windowEl.value) : 1;
      if (!maxPerWindow || !isFinite(hours) || hours <= 0) return undefined;
      var windowSeconds = Math.floor(hours * 3600);
      return {
        maxPerWindow: maxPerWindow,
        windowSeconds: windowSeconds,
        expiresAt: Math.floor(Date.now() / 1000) + windowSeconds,
      };
    }

    var confirmEl = document.getElementById('${confirmId}');
    if (confirmEl) {
      confirmEl.addEventListener('click', function () {
        window.dialogAPI.resolve({ confirmed: true, upgradeBudget: readUpgrade() });
      });
    }
    var cancels = document.querySelectorAll('[data-action="cancel"]');
    for (var i = 0; i < cancels.length; i++) {
      cancels[i].addEventListener('click', function () {
        window.dialogAPI.resolve({ confirmed: false });
      });
    }
  }());
`;
