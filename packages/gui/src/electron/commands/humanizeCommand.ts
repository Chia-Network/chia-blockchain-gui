import { i18n } from '../../config/locales';

import { findCommandSchemaById } from './findCommandSchemaById';
import { humanizeParams } from './humanizeParams';

export async function humanizeCommand(commandId: string, data: Record<string, unknown>, networkPrefix?: string) {
  const commandSchema = findCommandSchemaById(commandId);
  if (commandSchema) {
    return {
      destructive: commandSchema.destructive === true,
      title: commandSchema.title(),
      message: commandSchema.message(),
      confirmLabel: commandSchema.confirmLabel(),
      rows: await humanizeParams(commandSchema.params, data, networkPrefix),
    };
  }

  return {
    destructive: false,
    title: i18n._(/* i18n */ { id: 'Confirm' }),
    message: i18n._(/* i18n */ { id: 'Please review and confirm this action.' }),
    confirmLabel: i18n._(/* i18n */ { id: 'Proceed' }),
    rows: [],
  };
}
