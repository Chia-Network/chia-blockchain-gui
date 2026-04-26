import React from 'react';

import { i18n } from '../../../config/locales';
import {
  POLICY_SCOPES,
  READ_SCOPES,
  Scope,
  scopeDescription,
  scopeLabel,
  type PolicyScopeState,
  type SessionScopes,
} from '../../constants/WalletConnectScopeMap';

export type WalletConnectPermissionsProps = {
  confirmId: string;
  topic: string;
  requestedCommands: string[];
  dappName?: string;
  dappUrl?: string;
  dappDescription?: string;
  currentScopes: SessionScopes;
  styleURL?: string;
  isDarkMode?: boolean;
};

// 1 XCH = 1e12 mojos. We display budgets in XCH for human readability and convert
// back to mojo strings when packaging the SessionScopes payload.
const MOJOS_PER_XCH = 1_000_000_000_000n;

function readEnabled(scopes: SessionScopes, scope: Scope): boolean {
  const state = (scopes as any)[scope];
  if (state && 'enabled' in state) return Boolean(state.enabled);
  return false;
}

function policyState(scopes: SessionScopes, scope: Scope): PolicyScopeState {
  const state = (scopes as any)[scope];
  if (state && 'policy' in state) return state as PolicyScopeState;
  return { policy: 'ask' };
}

function mojosToXch(mojos: string | undefined): string {
  if (!mojos) return '';
  try {
    const m = BigInt(mojos);
    const whole = m / MOJOS_PER_XCH;
    const frac = m % MOJOS_PER_XCH;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(12, '0').replace(/0+$/, '');
    return `${whole.toString()}.${fracStr}`;
  } catch {
    return '';
  }
}

function windowToHours(seconds: number | undefined): string {
  if (!seconds) return '24';
  return (seconds / 3600).toString();
}

export default function WalletConnectPermissions(props: WalletConnectPermissionsProps) {
  const {
    confirmId,
    topic,
    requestedCommands,
    dappName,
    dappUrl,
    dappDescription,
    currentScopes,
  } = props;

  const requestedSet = new Set(requestedCommands);

  return (
    <div className="p-4 flex flex-col h-full text-gray-900 dark:text-gray-100" data-testid="wc-permissions">
      <input type="hidden" id="wc-topic" value={topic} />

      <div className="mb-4">
        <p className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-1">
          {i18n._(/* i18n */ { id: 'Consolidated WalletConnect permissions' })}
        </p>
        <h2 className="mt-0 mb-1 text-lg font-semibold">
          {dappName || i18n._(/* i18n */ { id: 'Unknown dApp' })}
        </h2>
        {dappUrl && <p className="text-sm text-gray-500 dark:text-gray-400 break-all my-1">{dappUrl}</p>}
        {dappDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-300 my-2">{dappDescription}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 break-all mt-2">
          {i18n._(/* i18n */ { id: 'Session topic' })}: <span className="font-mono">{topic.slice(0, 16)}…</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
          {i18n._(
            /* i18n */ {
              id: 'Choose once how this app can use your wallet. Harmless reads can be allowed up front, balance access is separate, and money movement can be blocked, asked every time, or allowed only within the limits you set.',
            },
          )}
        </p>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
          {i18n._(/* i18n */ { id: 'General access' })}
        </h3>
        <div className="grid gap-2">
          {READ_SCOPES.map((scope) => {
            const enabled = readEnabled(currentScopes, scope);
            return (
              <label
                key={scope}
                className="flex items-start justify-between p-3 rounded-md border border-gray-200 dark:border-gray-700"
              >
                <span className="flex flex-col mr-3">
                  <span className="text-sm font-medium">{scopeLabel(scope)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{scopeDescription(scope)}</span>
                </span>
                <input
                  type="checkbox"
                  data-read-scope={scope}
                  defaultChecked={enabled}
                  className="mt-1 h-4 w-4"
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
          {i18n._(/* i18n */ { id: 'Money movement and sensitive actions' })}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {i18n._(
            /* i18n */ {
              id: 'Choose how requests for these actions are handled. Block rejects them. Ask prompts only when money or sensitive wallet state is involved. Allow auto-approves only inside the budget you set and falls back to Ask when a request exceeds it.',
            },
          )}
        </p>
        <div className="grid gap-2">
          {POLICY_SCOPES.map((scope) => {
            const state = policyState(currentScopes, scope);
            const allowExpanded = state.policy === 'allow';
            return (
              <div
                key={scope}
                className="p-3 rounded-md border border-gray-200 dark:border-gray-700"
                data-policy-row={scope}
              >
                <div className="flex items-start justify-between">
                  <span className="flex flex-col mr-3 min-w-0">
                    <span className="text-sm font-medium">{scopeLabel(scope)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{scopeDescription(scope)}</span>
                  </span>
                  <span className="flex flex-row gap-1">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name={`policy-${scope}`}
                        value="block"
                        data-policy-scope={scope}
                        defaultChecked={state.policy === 'block'}
                      />
                      <span>{i18n._(/* i18n */ { id: 'Block' })}</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name={`policy-${scope}`}
                        value="ask"
                        data-policy-scope={scope}
                        defaultChecked={state.policy === 'ask'}
                      />
                      <span>{i18n._(/* i18n */ { id: 'Ask' })}</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="radio"
                        name={`policy-${scope}`}
                        value="allow"
                        data-policy-scope={scope}
                        defaultChecked={state.policy === 'allow'}
                      />
                      <span>{i18n._(/* i18n */ { id: 'Allow' })}</span>
                    </label>
                  </span>
                </div>
                <div
                  data-budget-row={scope}
                  className="mt-3 grid grid-cols-2 gap-2"
                  style={{ display: allowExpanded ? 'grid' : 'none' }}
                >
                  <label className="flex flex-col text-xs">
                    <span className="text-gray-500 dark:text-gray-400 mb-1">
                      {i18n._(/* i18n */ { id: 'Max per transaction (XCH)' })}
                    </span>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      data-budget-field="maxPerTx"
                      defaultValue={mojosToXch(state.maxPerTx)}
                      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </label>
                  <label className="flex flex-col text-xs">
                    <span className="text-gray-500 dark:text-gray-400 mb-1">
                      {i18n._(/* i18n */ { id: 'Max fee per tx (XCH)' })}
                    </span>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      data-budget-field="maxFeePerTx"
                      defaultValue={mojosToXch(state.maxFeePerTx)}
                      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </label>
                  <label className="flex flex-col text-xs">
                    <span className="text-gray-500 dark:text-gray-400 mb-1">
                      {i18n._(/* i18n */ { id: 'Max per window (XCH)' })}
                    </span>
                    <input
                      type="number"
                      step="0.000001"
                      min="0"
                      data-budget-field="maxPerWindow"
                      defaultValue={mojosToXch(state.maxPerWindow)}
                      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </label>
                  <label className="flex flex-col text-xs">
                    <span className="text-gray-500 dark:text-gray-400 mb-1">
                      {i18n._(/* i18n */ { id: 'Window length (hours)' })}
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      data-budget-field="windowHours"
                      defaultValue={windowToHours(state.windowSeconds)}
                      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </label>
                  <label className="flex flex-col text-xs col-span-2">
                    <span className="text-gray-500 dark:text-gray-400 mb-1">
                      {i18n._(/* i18n */ { id: 'Expires in (hours, blank for no expiry)' })}
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      data-budget-field="expiresHours"
                      defaultValue=""
                      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {requestedCommands.length > 0 && (
        <details className="mb-4">
          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
            {i18n._(/* i18n */ { id: 'Requested commands' })} ({requestedCommands.length})
          </summary>
          <pre className="text-xs mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded break-all whitespace-pre-wrap">
            {Array.from(requestedSet).join('\n')}
          </pre>
        </details>
      )}

      <div className="flex justify-end gap-3 mt-auto">
        <button
          type="button"
          data-action="cancel"
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {i18n._(/* i18n */ { id: 'Cancel' })}
        </button>
        <button
          type="button"
          id={confirmId}
          className="px-4 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-md hover:bg-green-600"
        >
          {i18n._(/* i18n */ { id: 'Save Permissions' })}
        </button>
      </div>
    </div>
  );
}

// Behavior script for the dialog window. Runs sandboxed; reads form state, packages the
// SessionScopes payload, and resolves the dialog promise. Also wires the Allow radio to
// expand its budget grid in real time.
export const walletConnectPermissionsScript = (confirmId: string) => `
  (function () {
    var MOJOS_PER_XCH = BigInt('1000000000000');

    function xchToMojos(value) {
      if (value === undefined || value === null) return undefined;
      var s = String(value).trim();
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

    function readBudget(rowEl) {
      var fields = rowEl.querySelectorAll('[data-budget-field]');
      var budget = {};
      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        var key = f.getAttribute('data-budget-field');
        var raw = f.value === undefined ? '' : String(f.value).trim();
        if (raw === '') continue;
        if (key === 'windowHours') {
          var hours = Number(raw);
          if (isFinite(hours) && hours > 0) budget.windowSeconds = Math.floor(hours * 3600);
        } else if (key === 'expiresHours') {
          var hrs = Number(raw);
          if (isFinite(hrs) && hrs > 0) {
            budget.expiresAt = Math.floor(Date.now() / 1000) + Math.floor(hrs * 3600);
          }
        } else {
          var mojos = xchToMojos(raw);
          if (mojos !== undefined) budget[key] = mojos;
        }
      }
      return budget;
    }

    function readPolicyScopes() {
      var scopes = {};
      var policyRows = document.querySelectorAll('[data-policy-row]');
      for (var i = 0; i < policyRows.length; i++) {
        var row = policyRows[i];
        var scope = row.getAttribute('data-policy-row');
        var checked = row.querySelector('input[data-policy-scope][type="radio"]:checked');
        var policy = checked ? checked.value : 'ask';
        var entry = { policy: policy };
        if (policy === 'allow') {
          var budgetRow = row.querySelector('[data-budget-row]');
          if (budgetRow) {
            var budget = readBudget(budgetRow);
            for (var k in budget) {
              if (Object.prototype.hasOwnProperty.call(budget, k)) entry[k] = budget[k];
            }
          }
        }
        scopes[scope] = entry;
      }
      return scopes;
    }

    function readReadScopes() {
      var out = {};
      var readToggles = document.querySelectorAll('input[data-read-scope]');
      for (var i = 0; i < readToggles.length; i++) {
        var el = readToggles[i];
        var scope = el.getAttribute('data-read-scope');
        out[scope] = { enabled: el.checked === true };
      }
      return out;
    }

    // Wire policy radios so the Allow budget grid is shown only when 'allow' is picked.
    var rows = document.querySelectorAll('[data-policy-row]');
    for (var r = 0; r < rows.length; r++) {
      (function (row) {
        var radios = row.querySelectorAll('input[data-policy-scope][type="radio"]');
        var budgetRow = row.querySelector('[data-budget-row]');
        function update() {
          var checked = row.querySelector('input[data-policy-scope][type="radio"]:checked');
          if (budgetRow) budgetRow.style.display = checked && checked.value === 'allow' ? 'grid' : 'none';
        }
        for (var i = 0; i < radios.length; i++) {
          radios[i].addEventListener('change', update);
        }
      }(rows[r]));
    }

    var confirmEl = document.getElementById('${confirmId}');
    if (confirmEl) {
      confirmEl.addEventListener('click', function () {
        var scopes = Object.assign({}, readReadScopes(), readPolicyScopes());
        window.dialogAPI.resolve({ approved: true, scopes: scopes });
      });
    }
    var cancels = document.querySelectorAll('[data-action="cancel"]');
    for (var j = 0; j < cancels.length; j++) {
      cancels[j].addEventListener('click', function () {
        window.dialogAPI.resolve({ approved: false });
      });
    }
  }());
`;
