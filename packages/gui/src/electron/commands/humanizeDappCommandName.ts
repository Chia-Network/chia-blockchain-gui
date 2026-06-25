import { getDappCommandSchema } from './getDappCommandSchema';

export function humanizeDappCommandName(dappCommand: string): string {
  if (!dappCommand) {
    return dappCommand;
  }

  try {
    const dappCommandSchema = getDappCommandSchema(dappCommand);

    return dappCommandSchema.title() ?? dappCommand;
  } catch (error) {
    return dappCommand;
  }
}
