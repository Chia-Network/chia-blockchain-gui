import { getDappCommandSchema } from './getDappCommandSchema';

type DappCommandMetadata = {
  requiresSync: boolean;
};

export function getDappCommandMetadata(dappCommand: string): DappCommandMetadata {
  const dappCommandSchema = getDappCommandSchema(dappCommand);

  return {
    requiresSync: dappCommandSchema.requiresSync === true,
  };
}
