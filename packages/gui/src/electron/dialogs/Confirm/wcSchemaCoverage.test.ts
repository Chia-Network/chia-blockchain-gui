/**
 * Pins `confirmSchemas` to the curated `params` list in
 * `WalletConnectCommands.tsx`. For every non-bypass dapp command, every
 * non-hidden WC param must show up in the matching schema (in snake_case),
 * because the WC list is the canonical "what to show the user" curation —
 * everything outside it falls into the raw-data collapsible.
 *
 * The WC source pulls in JSX/CSS that jest's transformer can't load, so we
 * parse the source file as text the same way as `wcRpcResolver.test.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { snakeCase } from 'lodash';

import { resolveDaemonRpc } from '../../utils/wcRpcResolver';
import { getConfirmSchema, SCHEMA_COMMANDS } from './confirmSchemas';

const WC_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '../../../constants/WalletConnectCommands.tsx'),
  'utf8',
);

type WcParam = {
  name: string;
  hide?: boolean;
};

type WcEntry = {
  command: string;
  service?: string;
  serviceCommand?: string;
  bypassConfirm: boolean;
  params: WcParam[];
};

/** Strip `// …` line comments so we don't accidentally match `hide: true`
 *  from inside a commented-out option. Block comments aren't used in the WC
 *  source, so we only handle line comments. */
function stripLineComments(src: string): string {
  return src.replace(/^[^\n'"`]*\/\/[^\n]*$/gm, '');
}

function parseEntries(source: string): WcEntry[] {
  const cleaned = stripLineComments(source);
  const entries: WcEntry[] = [];
  const startRe = /\n {2}\{\n/g;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = startRe.exec(cleaned))) starts.push(m.index + 1);

  for (const start of starts) {
    const closeRe = /\n {2}\},/g;
    closeRe.lastIndex = start;
    const close = closeRe.exec(cleaned);
    if (!close) continue;
    const block = cleaned.slice(start, close.index + close[0].length);
    const command = /command: '([^']+)'/.exec(block)?.[1];
    if (!command) continue;
    const service = /service: ServiceName\.([A-Z_]+)|service: '([A-Z]+)'/.exec(block);
    const bypassConfirm = /bypassConfirm: true/.test(block);
    const serviceCommand = /serviceCommand: '([^']+)'/.exec(block)?.[1];
    entries.push({
      command,
      service: service ? service[1] || service[2] : undefined,
      serviceCommand,
      bypassConfirm,
      params: parseParams(block),
    });
  }
  return entries;
}

function parseParams(block: string): WcParam[] {
  // Each param entry inside `params: [...]` references
  // `WalletConnectCommandParamName.X`. We capture each `name:` reference and
  // optionally a sibling `hide: true` on the same param object. Enum keys can
  // contain digits (e.g. `NEW_P2_PUZHASH`, `HASH1`), so allow `[A-Z0-9_]+`.
  const params: WcParam[] = [];
  const paramRe =
    /name: WalletConnectCommandParamName\.([A-Z][A-Z0-9_]*)([\s\S]*?)(?=,?\s*\}\s*,?\s*(?:\{|\]))/g;
  let pm: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((pm = paramRe.exec(block))) {
    const enumKey = pm[1];
    const tail = pm[2] || '';
    params.push({
      name: enumValueOf(enumKey),
      hide: /hide:\s*true/.test(tail),
    });
  }
  return params;
}

// Lazy-loaded mirror of the WalletConnectCommandParamName enum source so we
// don't need to evaluate the renderer module.
const ENUM_SOURCE = fs.readFileSync(
  path.resolve(__dirname, '../../../@types/WalletConnectCommandParamName.ts'),
  'utf8',
);
const ENUM_VALUES: Record<string, string> = {};
for (const m of ENUM_SOURCE.matchAll(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*'([^']+)'/gm)) {
  ENUM_VALUES[m[1]] = m[2];
}

function enumValueOf(key: string): string {
  return ENUM_VALUES[key] ?? key.toLowerCase();
}

const ALL = parseEntries(WC_SOURCE);

const dispatchable = ALL.filter(
  (e) => e.service !== 'EXECUTE' && e.service !== 'NOTIFICATION' && !e.bypassConfirm,
);

// Service.X → namespaced RPC. WC `service` is the SHOUTY enum name from
// ServiceName; the values are kebab-ish snake_case identifiers like
// `chia_wallet`, `chia_full_node`, `chia_data_layer`, `daemon`.
const SERVICE_TO_DESTINATION: Record<string, string> = {
  WALLET: 'chia_wallet',
  FULL_NODE: 'chia_full_node',
  FARMER: 'chia_farmer',
  HARVESTER: 'chia_harvester',
  SIMULATOR: 'chia_full_node_simulator',
  DAEMON: 'daemon',
  PLOTTER: 'chia_plotter',
  TIMELORD: 'chia_timelord',
  INTRODUCER: 'chia_introducer',
  EVENTS: 'wallet_ui',
  DATALAYER: 'chia_data_layer',
  DATALAYER_SERVER: 'chia_data_layer_http',
};

function nsCommandFor(entry: WcEntry): string | undefined {
  const dest = entry.service ? SERVICE_TO_DESTINATION[entry.service] : undefined;
  if (!dest) return undefined;
  // The renderer's dispatch sends `command` (NOT `serviceCommand`, which is
  // a renderer-only RTK Query routing override) through `resolveDaemonRpc`.
  return `${dest}.${resolveDaemonRpc(entry.command)}`;
}

// Some WC entries route to RPCs that intentionally don't have a confirm
// schema (orchestration commands like createNewDIDWallet/transferDID, or
// schemas main currently lacks for non-curation reasons). Track them so the
// coverage assertion fails loudly when something *else* slips out.
const KNOWN_GAPS = new Set([
  // Orchestration commands without a single backing daemon RPC.
  'createNewDIDWallet',
  'transferDID',
  // `addCATToken` is renderer-side RTK Query orchestration (createWallet +
  // setName); no single dispatchAsPair RPC handles it cleanly.
  'addCATToken',
]);

/**
 * WC param names rendered by a schema's `enrich` block instead of as a
 * flat row (offer summaries get the offered/requested breakdown with NFT
 * thumbnails — not a JSON dump). The coverage assertion treats these as
 * already-covered.
 */
const ENRICH_HANDLED: Record<string, Set<string>> = {
  'chia_wallet.create_offer_for_ids': new Set(['offer']),
  'chia_wallet.take_offer': new Set(['offer']),
};

describe('WC params → confirmSchemas coverage', () => {
  it('parses WC entries (sanity)', () => {
    expect(ALL.length).toBeGreaterThan(50);
    expect(dispatchable.find((e) => e.command === 'sendTransaction')).toBeDefined();
    expect(dispatchable.find((e) => e.command === 'spendCAT')).toBeDefined();
    // sendTransaction has at least amount/fee/address visible plus walletId hidden.
    const sendTx = ALL.find((e) => e.command === 'sendTransaction');
    expect(sendTx?.params.find((p) => p.name === 'walletId')?.hide).toBe(true);
    expect(sendTx?.params.find((p) => p.name === 'amount')?.hide).toBeFalsy();
  });

  it('every dispatchable WC command resolves to a schema (or is documented as a known gap)', () => {
    const missing: string[] = [];
    for (const entry of dispatchable) {
      if (KNOWN_GAPS.has(entry.command)) continue;
      const ns = nsCommandFor(entry);
      if (!ns) continue;
      if (!SCHEMA_COMMANDS.includes(ns)) {
        missing.push(`${entry.command} → ${ns}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every non-hidden WC param appears in the matching schema (snake_cased)', () => {
    const failures: string[] = [];
    for (const entry of dispatchable) {
      if (KNOWN_GAPS.has(entry.command)) continue;
      const ns = nsCommandFor(entry);
      if (!ns || !SCHEMA_COMMANDS.includes(ns)) continue;
      const schema = getConfirmSchema(ns);
      const schemaNames = new Set(schema.params.map((p) => p.name));
      const enrichHandled = ENRICH_HANDLED[ns] ?? new Set<string>();
      for (const param of entry.params) {
        if (param.hide) continue;
        const expected = snakeCase(param.name);
        if (!schemaNames.has(expected) && !enrichHandled.has(expected)) {
          failures.push(`${entry.command} (${ns}): missing param "${expected}"`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  // Hidden WC params shouldn't be in the schema either — they're hidden for
  // a reason (e.g. `walletId: 1` defaults that pollute the dialog with
  // boilerplate). Catches accidental over-inclusion.
  it('hidden WC params are not in the schema', () => {
    const overincluded: string[] = [];
    for (const entry of dispatchable) {
      if (KNOWN_GAPS.has(entry.command)) continue;
      const ns = nsCommandFor(entry);
      if (!ns || !SCHEMA_COMMANDS.includes(ns)) continue;
      const schema = getConfirmSchema(ns);
      const schemaNames = new Set(schema.params.map((p) => p.name));
      for (const param of entry.params) {
        if (!param.hide) continue;
        const expected = snakeCase(param.name);
        if (schemaNames.has(expected)) {
          overincluded.push(`${entry.command} (${ns}): hidden param "${expected}" leaked into schema`);
        }
      }
    }
    expect(overincluded).toEqual([]);
  });
});
