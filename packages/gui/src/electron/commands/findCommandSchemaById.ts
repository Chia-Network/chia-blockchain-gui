import { Commands, type CommandSchema } from './Commands';

export function findCommandSchemaById(commandId: keyof typeof Commands): CommandSchema | undefined {
  if (commandId in Commands) {
    return Commands[commandId];
  }

  return undefined;
}
