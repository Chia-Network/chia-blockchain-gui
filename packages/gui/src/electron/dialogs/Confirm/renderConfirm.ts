// Resolves the registry schema into flat dialog rows + enrichment display.
// Sync param kinds run from `data` directly; `mojo-to-cat` and `enrich` do
// daemon RPCs in parallel.
import { i18n } from '../../../config/locales';

import { type EnrichmentDisplay, lookupCat } from '../../utils/dappEnrichment';
import mojoToCatLocaleString from '../../utils/mojoToCATLocaleString';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';

import { getCommandSchema, resolveTexts, type ParamSchema } from '../../constants/commandRegistry';

export type ConfirmRenderContext = {
  networkPrefix?: string;
};

export type ConfirmRow = {
  field: string;
  label: string;
  value: string;
};

export type ConfirmRenderResult = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  rows: ConfirmRow[];
  display: EnrichmentDisplay;
};

function formatMojoXch(amount: unknown, networkPrefix?: string): string {
  const formatted = mojoToChiaLocaleString(amount as string | number);
  return networkPrefix ? `${formatted} ${networkPrefix.toUpperCase()}` : formatted;
}

async function formatMojoCat(
  amount: unknown,
  data: Record<string, unknown>,
  symbolFrom: string,
): Promise<string> {
  const formatted = mojoToCatLocaleString(amount as string | number);
  const walletIdRaw = data[symbolFrom];
  if (walletIdRaw === undefined || walletIdRaw === null) return formatted;
  const cat = await lookupCat(walletIdRaw as number | string);
  return cat?.displayName ? `${formatted} ${cat.displayName}` : formatted;
}

function isPresent(raw: unknown): boolean {
  return raw !== undefined && raw !== null && raw !== '';
}

async function formatParamValue(
  param: ParamSchema,
  raw: unknown,
  data: Record<string, unknown>,
  ctx: ConfirmRenderContext,
): Promise<string> {
  switch (param.type) {
    case 'text':
      return String(raw);
    case 'mojo-to-xch':
      return formatMojoXch(raw, ctx.networkPrefix);
    case 'mojo-to-cat':
      return formatMojoCat(raw, data, param.symbolFrom);
    case 'bool':
      return raw ? i18n._(/* i18n */ { id: 'Yes' }) : i18n._(/* i18n */ { id: 'No' });
    case 'json':
      try {
        return JSON.stringify(raw, null, 2);
      } catch {
        return String(raw);
      }
    default: {
      // Exhaustiveness check.
      const exhaustive: never = param;
      throw new Error(`Unhandled param type: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export async function renderConfirm(
  command: string,
  data: Record<string, unknown>,
  ctx: ConfirmRenderContext = {},
): Promise<ConfirmRenderResult> {
  const schema = getCommandSchema(command);

  const [resolvedRows, display] = await Promise.all([
    Promise.all(
      schema.params.map(async (param) => {
        const raw = data[param.name];
        if (!isPresent(raw)) return undefined;
        const value = await formatParamValue(param, raw, data, ctx);
        return { field: param.name, label: param.label(), value } satisfies ConfirmRow;
      }),
    ),
    schema.enrich ? schema.enrich(data) : Promise.resolve<EnrichmentDisplay>({}),
  ]);

  // Drop the `fee` param row when offer enrichment already shows it —
  // otherwise the dialog renders fee twice (once at the top with the other
  // params, once in the offer summary card below).
  const offerShowsFee = display.offer?.fee !== undefined;
  const rows = resolvedRows.filter((r): r is ConfirmRow => {
    if (r === undefined) return false;
    if (r.field === 'fee' && offerShowsFee) return false;
    return true;
  });

  return {
    ...resolveTexts(schema),
    destructive: schema.destructive ?? false,
    rows,
    display,
  };
}
