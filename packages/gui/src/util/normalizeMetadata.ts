import type { NFTAttribute } from '@chia-network/api';

import type Metadata from '../@types/Metadata';

export const INVALID_METADATA_ERROR = 'Invalid metadata';

// The longest URL the structural validator accepts; a longer one could
// never be fetched, so it is dropped here rather than carried around.
const MAX_URI_LENGTH = 2084;

// Bounds on what a metadata file may make the GUI hold and render. A file
// of the allowed size can hold hundreds of thousands of attributes or a
// million short uris; the views map every entry into the DOM, and the
// verifiers only ever look at the first few uris of a list.
export const MAX_METADATA_ATTRIBUTES = 200;
export const MAX_METADATA_URIS = 50;
export const MAX_METADATA_NAME_LENGTH = 1024;
export const MAX_METADATA_TEXT_LENGTH = 16 * 1024;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

// Numbers and booleans are common where the spec says string (an attribute
// value of 7, a "sensitive_content" of true); they read the same once shown.
function asText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function asBoundedText(value: unknown, maxLength: number): string | undefined {
  const text = asText(value);
  return text !== undefined && text.length > maxLength ? text.slice(0, maxLength) : text;
}

function asUris(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value
    .filter((uri): uri is string => typeof uri === 'string' && uri.length > 0 && uri.length <= MAX_URI_LENGTH)
    .slice(0, MAX_METADATA_URIS);
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

// An attribute names a trait (trait_type, or name in older files) and holds
// a value; a ranking attribute also carries numeric bounds, which the
// rankings view relies on and which stay numbers. Values keep their type:
// the views show them as text, the ranking check needs the numbers.
function asAttributes(value: unknown): NFTAttribute[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const attributes: NFTAttribute[] = [];
  value.slice(0, MAX_METADATA_ATTRIBUTES * 4).forEach((entry) => {
    if (attributes.length >= MAX_METADATA_ATTRIBUTES || !isPlainObject(entry)) {
      return;
    }
    const traitType = asBoundedText(entry.trait_type, MAX_METADATA_NAME_LENGTH);
    const name = asBoundedText(entry.name, MAX_METADATA_NAME_LENGTH);
    const traitValue =
      typeof entry.value === 'number' && Number.isFinite(entry.value)
        ? entry.value
        : asBoundedText(entry.value, MAX_METADATA_NAME_LENGTH);
    if ((traitType === undefined && name === undefined) || traitValue === undefined) {
      return;
    }
    attributes.push(
      withoutUndefined({
        trait_type: traitType,
        name,
        value: traitValue,
        min_value: asFiniteNumber(entry.min_value),
        max_value: asFiniteNumber(entry.max_value),
      }),
    );
  });
  return attributes;
}

function withoutUndefined<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}

/** The shape the rest of the GUI may rely on, from whatever a metadata file
 * held. Metadata is minter-authored: a field that is not what the schema says
 * — a URI list that is an object, a hash that is a number, a description that
 * is a nested document — is dropped or coerced here, once, so that no caller
 * has to defend against it, and no tile can take the gallery down by calling
 * an array method on something else. Fields outside the schema are kept as
 * they are. Anything but an object at the root is refused. */
export default function normalizeMetadata(parsed: unknown): Metadata {
  if (!isPlainObject(parsed)) {
    throw new Error(INVALID_METADATA_ERROR);
  }

  const collection = isPlainObject(parsed.collection)
    ? withoutUndefined({
        ...parsed.collection,
        name: asBoundedText(parsed.collection.name, MAX_METADATA_NAME_LENGTH),
        id: asBoundedText(parsed.collection.id, MAX_METADATA_NAME_LENGTH),
        attributes: asAttributes(parsed.collection.attributes),
      })
    : undefined;

  // CHIP-0007 allows a boolean, a string naming the kind of sensitive
  // content, or a list of such strings; hasSensitiveContent treats any of
  // them but false/"false" as sensitive, so all of those forms are kept.
  const sensitiveContent = parsed.sensitive_content;
  let sensitive: boolean | string | string[] | undefined;
  if (typeof sensitiveContent === 'boolean' || typeof sensitiveContent === 'string') {
    sensitive = sensitiveContent;
  } else if (Array.isArray(sensitiveContent)) {
    const kinds = sensitiveContent.filter((kind): kind is string => typeof kind === 'string');
    sensitive = kinds.length > 0 ? kinds : undefined;
  }

  return withoutUndefined({
    ...parsed,
    name: asBoundedText(parsed.name, MAX_METADATA_NAME_LENGTH),
    description: asBoundedText(parsed.description, MAX_METADATA_TEXT_LENGTH),
    image: asString(parsed.image),
    format: asString(parsed.format),
    minting_tool: asBoundedText(parsed.minting_tool, MAX_METADATA_NAME_LENGTH),
    sensitive_content: sensitive,
    attributes: asAttributes(parsed.attributes),
    collection,
    preview_video_uris: asUris(parsed.preview_video_uris),
    preview_video_hash: asString(parsed.preview_video_hash),
    preview_image_uris: asUris(parsed.preview_image_uris),
    preview_image_hash: asString(parsed.preview_image_hash),
  }) as Metadata;
}
