import normalizeMetadata, {
  INVALID_METADATA_ERROR,
  MAX_METADATA_ATTRIBUTES,
  MAX_METADATA_NAME_LENGTH,
  MAX_METADATA_TEXT_LENGTH,
  MAX_METADATA_URIS,
} from './normalizeMetadata';

const CID = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

describe('normalizeMetadata', () => {
  it('keeps a well-formed document as it is', () => {
    const metadata = {
      name: 'Sox #1272',
      description: 'A cat.',
      attributes: [{ trait_type: 'Eyes', value: 'Green' }],
      collection: { name: 'Sox', id: 'abc', attributes: [] },
      preview_image_uris: [`https://example.com/${CID}.png`, `ipfs://${CID}`],
      preview_image_hash: '0xabc',
      sensitive_content: false,
      minting_tool: 'MintGarden',
      series_number: 3,
    };
    expect(normalizeMetadata(metadata)).toEqual(metadata);
  });

  it.each([null, undefined, 5, 'text', [], [{ preview_image_uris: [] }]])('refuses a root that is %p', (root) => {
    expect(() => normalizeMetadata(root)).toThrow(INVALID_METADATA_ERROR);
  });

  it.each([{}, 5, 'https://example.com/a.png', null, true])(
    'drops a preview URI list that is %p instead of an array',
    (uris) => {
      const metadata = normalizeMetadata({ preview_image_uris: uris, preview_video_uris: uris });
      expect(metadata).not.toHaveProperty('preview_image_uris');
      expect(metadata).not.toHaveProperty('preview_video_uris');
    },
  );

  it('keeps only usable strings inside a preview URI list', () => {
    const metadata = normalizeMetadata({
      preview_image_uris: ['https://example.com/a.png', 7, null, {}, '', 'x'.repeat(3000), 'https://example.com/b.png'],
    });
    expect(metadata.preview_image_uris).toEqual(['https://example.com/a.png', 'https://example.com/b.png']);
  });

  it.each([{}, 5, [], true])('drops a hash that is %p instead of a string', (hash) => {
    const metadata = normalizeMetadata({ preview_image_hash: hash, preview_video_hash: hash });
    expect(metadata).not.toHaveProperty('preview_image_hash');
    expect(metadata).not.toHaveProperty('preview_video_hash');
  });

  it('turns numbers and booleans into text where text is shown, and drops documents', () => {
    const metadata = normalizeMetadata({
      name: 12,
      description: { nested: 'document' },
      attributes: [{ trait_type: 'Level', value: 7 }, { trait_type: {}, value: 'x' }, 'stray', null],
      collection: { name: ['not', 'text'], id: 9, attributes: 'none' },
      sensitive_content: 7,
    });
    expect(metadata.name).toBe('12');
    expect(metadata).not.toHaveProperty('description');
    expect(metadata.attributes).toEqual([{ trait_type: 'Level', value: 7 }]);
    expect(metadata.collection).toEqual({ id: '9' });
    expect(metadata).not.toHaveProperty('sensitive_content');
  });

  it('keeps ranking bounds and name-keyed attributes, dropping bounds that are not numbers', () => {
    const metadata = normalizeMetadata({
      attributes: [
        { trait_type: 'Speed', value: 7, min_value: 0, max_value: 10 },
        { name: 'Legacy', value: 'x' },
        { trait_type: 'Odd', value: 'y', min_value: 'low', max_value: Number.NaN },
      ],
    });
    expect(metadata.attributes).toEqual([
      { trait_type: 'Speed', value: 7, min_value: 0, max_value: 10 },
      { name: 'Legacy', value: 'x' },
      { trait_type: 'Odd', value: 'y' },
    ]);
  });

  it('bounds how much a file can make the GUI hold', () => {
    const metadata = normalizeMetadata({
      name: 'n'.repeat(5000),
      description: 'd'.repeat(100_000),
      attributes: Array.from({ length: 1000 }, (_, i) => ({ trait_type: `t${i}`, value: i })),
      preview_image_uris: Array.from({ length: 1000 }, (_, i) => `https://example.com/${i}.png`),
      collection: {
        name: 'c'.repeat(5000),
        attributes: Array.from({ length: 1000 }, () => ({ name: 'a', value: 'b' })),
      },
    });
    expect(metadata.name).toHaveLength(MAX_METADATA_NAME_LENGTH);
    expect(metadata.description).toHaveLength(MAX_METADATA_TEXT_LENGTH);
    expect(metadata.attributes).toHaveLength(MAX_METADATA_ATTRIBUTES);
    expect(metadata.preview_image_uris).toHaveLength(MAX_METADATA_URIS);
    expect(metadata.collection?.name).toHaveLength(MAX_METADATA_NAME_LENGTH);
    expect(metadata.collection?.attributes).toHaveLength(MAX_METADATA_ATTRIBUTES);
  });

  it.each([true, false, 'true', 'false', 'nudity', ['nudity', 'violence']])(
    'keeps a sensitive-content flag of %p',
    (flag) => {
      expect(normalizeMetadata({ sensitive_content: flag }).sensitive_content).toEqual(flag);
    },
  );

  it('keeps only the strings of a sensitive-content list and drops an empty one', () => {
    expect(normalizeMetadata({ sensitive_content: ['nudity', 3, null] }).sensitive_content).toEqual(['nudity']);
    expect(normalizeMetadata({ sensitive_content: [3] })).not.toHaveProperty('sensitive_content');
    expect(normalizeMetadata({ sensitive_content: {} })).not.toHaveProperty('sensitive_content');
  });

  it('drops a collection that is not an object', () => {
    expect(normalizeMetadata({ collection: 'Sox' })).not.toHaveProperty('collection');
  });

  it('does not let a __proto__ key reach the prototype', () => {
    const metadata = normalizeMetadata(JSON.parse('{"__proto__": {"polluted": true}, "name": "x"}'));
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(metadata)).toBe(Object.prototype);
  });
});
