import { Commands, type DappCommandSchema } from './Commands';

export const DappCommands = new Map<string, DappCommandSchema>();

function processDappCommands() {
  for (const [commandId, commandSchema] of Object.entries(Commands)) {
    if (commandSchema.dapp) {
      for (const dapp of commandSchema.dapp) {
        const { command } = dapp;

        if (DappCommands.has(command)) {
          throw new Error(`Duplicate dapp command "${command}"`);
        }

        const {
          title = commandSchema.title,
          message = commandSchema.message,
          confirmLabel = commandSchema.confirmLabel,
          params = [...commandSchema.params],
          destructive = commandSchema.destructive === true,
          ...rest
        } = dapp;

        DappCommands.set(command, {
          ...rest,
          commandId,
          title,
          message,
          confirmLabel,
          params,
          destructive,
        });
      }
    }
  }
}

processDappCommands();
