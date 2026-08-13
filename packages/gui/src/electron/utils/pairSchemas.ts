import { z } from 'zod';

const pairMetadataSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
});

export const pairRecordSchema = z.object({
  topic: z.string(),
  mainnet: z.boolean(),
  metadata: pairMetadataSchema,
  fingerprint: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  // wire form `chia_<name>`. Granted at pairing; empty = deny-all.
  commands: z.array(z.string()).default([]),
  bypass: z.array(z.string()).default([]),
});

export const pairPublicRecordSchema = z.object({
  topic: z.string(),
  mainnet: z.boolean(),
  metadata: pairMetadataSchema,
  fingerprint: z.number(),
  commands: z.array(z.string()),
  hasBypass: z.boolean(),
});

export type PairMetadata = z.infer<typeof pairMetadataSchema>;

export type PairRecord = z.infer<typeof pairRecordSchema>;

export type PairPublicRecord = z.infer<typeof pairPublicRecordSchema>;

export function toPairPublicRecord(pair: PairRecord): PairPublicRecord {
  return {
    topic: pair.topic,
    mainnet: pair.mainnet,
    metadata: pair.metadata,
    fingerprint: pair.fingerprint,
    commands: pair.commands,
    hasBypass: pair.bypass.length > 0,
  };
}
