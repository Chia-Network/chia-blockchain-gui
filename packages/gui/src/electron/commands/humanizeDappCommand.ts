import { getDappCommandSchema } from './getDappCommandSchema';
import { humanizeParams } from './humanizeParams';

export async function humanizeDappCommand(dappCommand: string, data: Record<string, unknown>, networkPrefix?: string) {
  const dappCommandSchema = getDappCommandSchema(dappCommand);

  const rows = await humanizeParams(dappCommandSchema.params, data, networkPrefix);

  return {
    destructive: dappCommandSchema.destructive === true,
    title: dappCommandSchema.title(),
    message: dappCommandSchema.message(),
    confirmLabel: dappCommandSchema.confirmLabel(),
    rows,
  };
}
