import { createOfferToWalletDelta, offerSummaryToWalletDelta } from './walletDelta';

type CreateOfferToWalletDeltaInput = Parameters<typeof createOfferToWalletDelta>[0];
type OfferSummaryToWalletDeltaInput = Parameters<typeof offerSummaryToWalletDelta>[0];

function nullRecord(entries: [string, unknown][]): Record<string, unknown> {
  const record: Record<string, unknown> = Object.create(null);

  for (const [key, value] of entries) {
    record[key] = value;
  }

  return record;
}

describe('createOfferToWalletDelta', () => {
  it('converts raw create offer signs into wallet spending and receiving', () => {
    expect(
      createOfferToWalletDelta({
        '1': '-2000',
        '6': '100',
        '7': 120n,
      }),
    ).toEqual({
      spending: {
        '1': 2000n,
      },
      receiving: {
        '6': 100n,
        '7': 120n,
      },
    });
  });

  it('keeps negative CAT and NFT entries in spending so callers can reject unsupported spending', () => {
    const nftLauncherId = '6b6b2a3b4c57c2b4596625583cbede95d081b59d18125fedb6b416a8ee46cfe5';

    expect(
      createOfferToWalletDelta({
        '6': '-100',
        [nftLauncherId]: -1n,
      }),
    ).toEqual({
      spending: {
        '6': 100n,
        [nftLauncherId]: 1n,
      },
      receiving: {},
    });
  });

  it('rejects xch keys in create-offer params because create offers use numeric wallet IDs', () => {
    expect(() =>
      createOfferToWalletDelta({
        xch: '-4',
      }),
    ).toThrow('XCH is not a valid asset ID');
  });

  it('treats zero as receiving to preserve the current create-offer split behavior', () => {
    expect(
      createOfferToWalletDelta({
        '1': '0',
      }),
    ).toEqual({
      spending: {},
      receiving: {
        '1': 0n,
      },
    });
  });

  it('keeps stable lowercase asset IDs unchanged', () => {
    const assetId = 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad';

    expect(
      createOfferToWalletDelta({
        [assetId]: '-7',
      }),
    ).toEqual({
      spending: {
        [assetId]: 7n,
      },
      receiving: {},
    });
  });

  it('keeps digit-only 64-character asset IDs unchanged', () => {
    const assetId = '1234567890123456789012345678901234567890123456789012345678901234';

    expect(
      createOfferToWalletDelta({
        [assetId]: '-7',
      }),
    ).toEqual({
      spending: {
        [assetId]: 7n,
      },
      receiving: {},
    });
  });

  it('rejects uppercase and whitespace-padded keys instead of normalizing them', () => {
    const assetId = 'D82DD03F8A9AD2F84353CD953C4DE6B21DBAAF7DE3BA3F4DDD9ABE31ECBA80AD';

    expect(() =>
      createOfferToWalletDelta({
        [assetId]: '-7',
      }),
    ).toThrow('Key is not a valid asset ID');

    expect(() =>
      createOfferToWalletDelta({
        ' xch ': '-5',
      }),
    ).toThrow('Key is not a valid asset ID');
  });

  it('rejects non-string keys defensively', () => {
    const entriesSpy = jest.spyOn(Object, 'entries').mockReturnValueOnce([[1 as unknown as string, '-7']]);

    try {
      expect(() =>
        createOfferToWalletDelta({
          xch: '-7',
        }),
      ).toThrow('Key is not a string');
    } finally {
      entriesSpy.mockRestore();
    }
  });

  it('accepts large bigint-safe string values without precision loss', () => {
    expect(
      createOfferToWalletDelta({
        '1': '-9007199254740993',
        '6': '1844674407370955161518446744073709551615',
      }),
    ).toEqual({
      spending: {
        '1': BigInt('9007199254740993'),
      },
      receiving: {
        '6': BigInt('1844674407370955161518446744073709551615'),
      },
    });
  });

  it('rejects missing, primitive, and array create-offer shapes', () => {
    expect(() => createOfferToWalletDelta(null as unknown as CreateOfferToWalletDeltaInput)).toThrow(
      'Offer is not valid',
    );
    expect(() => createOfferToWalletDelta('offer' as unknown as CreateOfferToWalletDeltaInput)).toThrow(
      'Offer is not valid',
    );
    expect(() => createOfferToWalletDelta(1 as unknown as CreateOfferToWalletDeltaInput)).toThrow('Offer is not valid');
    expect(() => createOfferToWalletDelta([] as unknown as CreateOfferToWalletDeltaInput)).toThrow(
      'Offer is not valid',
    );
  });

  it('documents the current gap that non-asset keys are accepted as create-offer entries', () => {
    expect(
      createOfferToWalletDelta({
        not_an_asset_id: '-1',
        also_not_an_asset_id: '2',
      }),
    ).toEqual({
      spending: {
        not_an_asset_id: 1n,
      },
      receiving: {
        also_not_an_asset_id: 2n,
      },
    });
  });

  it('rejects duplicate normalized create-offer keys in the same wallet direction', () => {
    const assetId = 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad';
    const entriesSpy = jest.spyOn(Object, 'entries').mockReturnValueOnce([
      [assetId, '-7'],
      [assetId, '-4'],
    ]);

    try {
      expect(() =>
        createOfferToWalletDelta({
          [assetId]: '-7',
        }),
      ).toThrow('Offer is not valid');
    } finally {
      entriesSpy.mockRestore();
    }
  });

  it('rejects malformed and unsafe mojo values', () => {
    expect(() =>
      createOfferToWalletDelta({
        '1': '-01',
      }),
    ).toThrow('Mojos has non-canonical format: "-01"');

    expect(() =>
      createOfferToWalletDelta({
        '1': Number.NEGATIVE_INFINITY,
      }),
    ).toThrow('Mojos must be an integer, got: -Infinity');
  });
});

describe('offerSummaryToWalletDelta', () => {
  it('converts a production-shaped XCH-for-CAT offer summary into taker wallet perspective', () => {
    const assetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';
    const summary = nullRecord([
      ['additions', []],
      ['fees', 0],
      ['infos', nullRecord([[assetId, nullRecord([])]])],
      ['offered', nullRecord([['xch', '1234']])],
      ['removals', []],
      ['requested', nullRecord([[assetId, '10000']])],
      ['valid_times', nullRecord([])],
    ]);

    expect(offerSummaryToWalletDelta(summary as OfferSummaryToWalletDeltaInput)).toEqual({
      spending: {
        [assetId]: BigInt('10000'),
      },
      receiving: {
        '1': 1234n,
      },
    });
  });

  it('converts production-shaped summaries with multiple requested assets', () => {
    const nftLauncherId = '0fbdb7f21392f248f4ce3f8b1497496f056db6eb3856990ea3f697e28ec082c4';
    const catAssetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';
    const secondCatAssetId = 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad';
    const summary = nullRecord([
      ['fees', 34],
      ['infos', nullRecord([[nftLauncherId, nullRecord([])]])],
      ['offered', nullRecord([['xch', '66']])],
      [
        'requested',
        nullRecord([
          [nftLauncherId, '1'],
          [catAssetId, '100000'],
          [secondCatAssetId, '200000'],
        ]),
      ],
    ]);

    expect(offerSummaryToWalletDelta(summary as OfferSummaryToWalletDeltaInput)).toEqual({
      spending: {
        [nftLauncherId]: 1n,
        [catAssetId]: BigInt('100000'),
        [secondCatAssetId]: BigInt('200000'),
      },
      receiving: {
        '1': 66n,
      },
    });
  });

  it('allows summaries that include xch in both offered and requested maps as separate wallet directions', () => {
    expect(
      offerSummaryToWalletDelta({
        offered: { xch: '66' },
        requested: { xch: '100' },
      }),
    ).toEqual({
      spending: {
        '1': 100n,
      },
      receiving: {
        '1': 66n,
      },
    });
  });

  it('rejects numeric XCH asset keys in offer summaries', () => {
    expect(() =>
      offerSummaryToWalletDelta({
        offered: { '1': '4' },
        requested: {},
      }),
    ).toThrow('Key is not a valid asset ID');

    expect(() =>
      offerSummaryToWalletDelta({
        offered: {},
        requested: { '1': '100' },
      }),
    ).toThrow('Key is not a valid asset ID');
  });

  it('converts requested XCH when offered does not also contain xch', () => {
    const offeredAssetId = 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad';
    const requestedAssetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';

    expect(
      offerSummaryToWalletDelta({
        offered: {
          [offeredAssetId]: '7',
        },
        requested: {
          xch: '100',
          [requestedAssetId]: '2',
        },
      }),
    ).toEqual({
      spending: {
        '1': 100n,
        [requestedAssetId]: 2n,
      },
      receiving: {
        [offeredAssetId]: 7n,
      },
    });
  });

  it('keeps stable lowercase asset IDs unchanged', () => {
    const assetId = 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad';

    expect(
      offerSummaryToWalletDelta({
        offered: { [assetId]: '7' },
        requested: {},
      }),
    ).toEqual({
      spending: {},
      receiving: {
        [assetId]: 7n,
      },
    });
  });

  it('keeps digit-only 64-character asset IDs unchanged', () => {
    const assetId = '1234567890123456789012345678901234567890123456789012345678901234';

    expect(
      offerSummaryToWalletDelta({
        offered: { [assetId]: '7' },
        requested: {},
      }),
    ).toEqual({
      spending: {},
      receiving: {
        [assetId]: 7n,
      },
    });
  });

  it('rejects uppercase and whitespace-padded keys instead of normalizing them', () => {
    const assetId = 'D82DD03F8A9AD2F84353CD953C4DE6B21DBAAF7DE3BA3F4DDD9ABE31ECBA80AD';

    expect(() =>
      offerSummaryToWalletDelta({
        offered: { [assetId]: '7' },
        requested: {},
      }),
    ).toThrow('Key is not a valid asset ID');

    expect(() =>
      offerSummaryToWalletDelta({
        offered: { ' xch ': '5' },
        requested: {},
      }),
    ).toThrow('Key is not a valid asset ID');
  });

  it('rejects non-string keys defensively', () => {
    const entriesSpy = jest.spyOn(Object, 'entries').mockReturnValueOnce([[1 as unknown as string, '7']]);

    try {
      expect(() =>
        offerSummaryToWalletDelta({
          offered: { xch: '7' },
          requested: {},
        }),
      ).toThrow('Key is not a string');
    } finally {
      entriesSpy.mockRestore();
    }
  });

  it('accepts large bigint-safe string values without precision loss', () => {
    const assetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';

    expect(
      offerSummaryToWalletDelta({
        offered: { xch: '9007199254740993' },
        requested: { [assetId]: '1844674407370955161518446744073709551615' },
      }),
    ).toEqual({
      spending: {
        [assetId]: BigInt('1844674407370955161518446744073709551615'),
      },
      receiving: {
        '1': BigInt('9007199254740993'),
      },
    });
  });

  it('rejects missing, primitive, and array summary shapes', () => {
    expect(() => offerSummaryToWalletDelta(null as unknown as OfferSummaryToWalletDeltaInput)).toThrow(
      'Offer is not valid',
    );
    expect(() => offerSummaryToWalletDelta('offer' as unknown as OfferSummaryToWalletDeltaInput)).toThrow(
      'Offer is not valid',
    );
    expect(() => offerSummaryToWalletDelta([] as unknown as OfferSummaryToWalletDeltaInput)).toThrow(
      'Offer is not valid',
    );
    expect(() => offerSummaryToWalletDelta({ requested: {} } as unknown as OfferSummaryToWalletDeltaInput)).toThrow(
      'Offer is not valid',
    );
    expect(() =>
      offerSummaryToWalletDelta({ offered: {}, requested: [] } as unknown as OfferSummaryToWalletDeltaInput),
    ).toThrow('Offer is not valid');
    expect(() =>
      offerSummaryToWalletDelta({ offered: [], requested: {} } as unknown as OfferSummaryToWalletDeltaInput),
    ).toThrow('Offer is not valid');
  });

  it('documents the current gap that non-asset keys are accepted as summary entries', () => {
    expect(
      offerSummaryToWalletDelta({
        offered: { not_an_asset_id: '1' },
        requested: { also_not_an_asset_id: '2' },
      }),
    ).toEqual({
      spending: {
        also_not_an_asset_id: 2n,
      },
      receiving: {
        not_an_asset_id: 1n,
      },
    });
  });

  it('rejects duplicate normalized summary keys when the duplicate is a numeric key', () => {
    expect(() =>
      offerSummaryToWalletDelta({
        offered: nullRecord([
          ['xch', '7'],
          ['1', '4'],
        ]),
        requested: {},
      }),
    ).toThrow('Key is not a valid asset ID');

    expect(() =>
      offerSummaryToWalletDelta({
        offered: {},
        requested: nullRecord([
          ['xch', '9'],
          ['1', '2'],
        ]),
      }),
    ).toThrow('Key is not a valid asset ID');
  });

  it('rejects malformed and negative mojo values', () => {
    const assetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';

    expect(() =>
      offerSummaryToWalletDelta({
        offered: { xch: '01' },
        requested: {},
      }),
    ).toThrow('Mojos has non-canonical format: "01"');

    expect(() =>
      offerSummaryToWalletDelta({
        offered: {},
        requested: { [assetId]: '-1' },
      }),
    ).toThrow('Mojos must be non-negative, got: -1');
  });
});
