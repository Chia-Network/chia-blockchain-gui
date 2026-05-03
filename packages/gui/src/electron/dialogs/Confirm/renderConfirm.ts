/**
 * Resolves a `ConfirmSchema` into the flat data the dialog actually renders.
 * Pure-formatting kinds (`text`, `mojo-to-xch`, `bool`) run synchronously
 * from `data`; the `mojo-to-cat` kind and `enrich` hook do daemon RPCs in
 * parallel. The dialog itself stays a dumb renderer of the result.
 */
import { i18n } from '../../../config/locales';

import { type EnrichmentDisplay, lookupCat } from '../../utils/dappEnrichment';
import mojoToCatLocaleString from '../../utils/mojoToCATLocaleString';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';

import { getConfirmSchema, resolveTexts, type ParamSchema } from './confirmSchemas';

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
      // Exhaustiveness check — if a new ParamType is added to the union and
      // not handled above, this assignment fails to compile because `param`
      // is no longer narrowed to `never`. Better error message than relying
      // on the missing-trailing-return inference.
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
  const schema = getConfirmSchema(command);

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

  return {
    ...resolveTexts(schema),
    destructive: schema.destructive ?? false,
    rows: resolvedRows.filter((r): r is ConfirmRow => r !== undefined),
    display,
  };
}
