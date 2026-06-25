export function parseCommandId(commandId: string): {
  destination: string;
  command: string;
} {
  const parts = commandId.split('.');
  if (parts.length !== 2) {
    throw new Error(`Malformed command id: ${commandId}`);
  }

  const destination = parts[0].trim();
  const command = parts[1].trim();

  if (destination.length === 0 || command.length === 0) {
    throw new Error(`Malformed command id: ${commandId}`);
  }

  return {
    destination,
    command,
  };
}
