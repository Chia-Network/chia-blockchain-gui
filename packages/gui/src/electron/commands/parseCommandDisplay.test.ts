import WalletType from '../constants/WalletType';

type WalletNamesResponse = Record<string, string>;
type WalletInfosResponse = Record<string, { name?: string; type?: WalletType }>;
type OfferSummaryResponse = {
  success?: boolean;
  summary?: {
    fees: unknown;
    offered: Record<string, unknown>;
    requested: Record<string, unknown>;
    infos?: Record<string, unknown>;
  };
};

const mockGetWalletNames = jest.fn<Promise<WalletNamesResponse>, []>();
const mockGetWalletInfos = jest.fn<Promise<WalletInfosResponse>, []>();
const mockGetOfferSummary = jest.fn<Promise<OfferSummaryResponse | null>, [string]>();
const mockNftGetInfo = jest.fn<Promise<unknown>, [string]>();
const mockCatAssetIdToName = jest.fn<Promise<{ name?: string }>, [string]>();

jest.mock('../api/catAssetIdToName', () => ({
  catAssetIdToName: mockCatAssetIdToName,
}));

jest.mock('../api/getWalletNames', () => ({
  getWalletNames: mockGetWalletNames,
  getWalletInfos: mockGetWalletInfos,
}));

jest.mock('../api/getOfferSummary', () => ({
  getOfferSummary: mockGetOfferSummary,
}));

jest.mock('../api/nftGetInfo', () => ({
  nftGetInfo: mockNftGetInfo,
}));

const { parseCommandDisplay } = jest.requireActual<typeof import('./parseCommandDisplay')>('./parseCommandDisplay');

function makeOfferSummary(overrides: Partial<OfferSummaryResponse['summary']> = {}): OfferSummaryResponse {
  return {
    success: true,
    summary: {
      fees: '0',
      offered: {},
      requested: {},
      ...overrides,
    },
  };
}

describe('parseCommandDisplay', () => {
  beforeEach(() => {
    mockGetWalletNames.mockReset();
    mockGetWalletInfos.mockReset();
    mockGetOfferSummary.mockReset();
    mockNftGetInfo.mockReset();
    mockCatAssetIdToName.mockReset();
  });

  it('displays raw create offer signs as spending and receiving wallet deltas', async () => {
    mockGetWalletInfos.mockResolvedValue({
      1: { name: 'Chia', type: WalletType.STANDARD_WALLET },
      6: { name: 'Test CAT', type: WalletType.CAT },
    });

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          1: -10_000,
          6: 2_323_000,
        },
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        spending: [
          {
            kind: 'xch',
          },
        ],
        receiving: [
          {
            kind: 'wallet',
            walletId: '6',
            walletName: 'Test CAT',
          },
        ],
      },
    });

    expect(mockGetWalletInfos).toHaveBeenCalledWith();
  });

  it('uses the legacy CAT fallback for requested bytes32 create-offer assets without drivers', async () => {
    const assetId = '1234567890123456789012345678901234567890123456789012345678901234';

    mockGetWalletInfos.mockResolvedValue({
      [assetId]: { name: 'Wallet name collision', type: WalletType.NFT },
    });
    mockCatAssetIdToName.mockResolvedValue({ name: 'TEST' });

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          [assetId]: '1000',
        },
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        receiving: [
          {
            kind: 'cat',
            assetId,
            symbol: 'TEST',
          },
        ],
      },
    });
    expect(mockNftGetInfo).not.toHaveBeenCalled();
  });

  it('fails closed when create-offer params use xch keys instead of numeric wallet IDs', async () => {
    mockGetWalletInfos.mockResolvedValue({});

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          xch: '-2000000000000',
        },
      }),
    ).rejects.toThrow('XCH is not a valid asset ID');
  });

  it('normalizes take-offer xch summary keys to XCH display rows', async () => {
    mockGetWalletInfos.mockResolvedValue({});
    mockGetOfferSummary.mockResolvedValue(
      makeOfferSummary({
        requested: {
          xch: '3000000000000',
        },
      }),
    );

    await expect(
      parseCommandDisplay('chia_wallet.take_offer', {
        offer: 'offer1...',
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        spending: [
          {
            kind: 'xch',
            amount: '3',
          },
        ],
        fee: '0',
      },
    });
  });

  it('uses offer summary infos to display take-offer singleton assets as NFTs', async () => {
    const nftLauncherId = '6b6b2a3b4c57c2b4596625583cbede95d081b59d18125fedb6b416a8ee46cfe5';
    mockGetWalletInfos.mockResolvedValue({});
    mockGetOfferSummary.mockResolvedValue(
      makeOfferSummary({
        requested: {
          [nftLauncherId]: '1',
        },
        infos: {
          [nftLauncherId]: {
            type: 'singleton',
          },
        },
      }),
    );
    mockNftGetInfo.mockResolvedValue({
      success: true,
      nft_info: {
        data_uris: ['https://example.com/nft.png'],
        royalty_percentage: 250,
      },
    });

    await expect(
      parseCommandDisplay('chia_wallet.take_offer', {
        offer: 'offer1...',
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        spending: [
          {
            kind: 'nft',
            previewUrl: 'https://example.com/nft.png',
            royaltyPercentage: 250,
          },
        ],
      },
    });
    expect(mockNftGetInfo).toHaveBeenCalledWith(nftLauncherId);
  });

  it('shows the take-offer fungible total with NFT creator royalties', async () => {
    const nftLauncherId = '6b6b2a3b4c57c2b4596625583cbede95d081b59d18125fedb6b416a8ee46cfe5';
    mockGetWalletInfos.mockResolvedValue({});
    mockGetOfferSummary.mockResolvedValue(
      makeOfferSummary({
        offered: {
          [nftLauncherId]: '1',
        },
        requested: {
          xch: '1000000000000',
        },
        infos: {
          [nftLauncherId]: {
            type: 'singleton',
          },
        },
      }),
    );
    mockNftGetInfo.mockResolvedValue({
      success: true,
      nft_info: {
        data_uris: [],
        royalty_percentage: 250,
      },
    });

    await expect(
      parseCommandDisplay('chia_wallet.take_offer', {
        offer: 'offer1...',
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        spending: [
          {
            kind: 'xch',
            amount: '1',
            amountWithRoyalties: '1.025',
          },
        ],
        receiving: [
          {
            kind: 'nft',
            royaltyPercentage: 250,
          },
        ],
      },
    });
  });

  it('shows the take-offer fungible total with multiple NFT creator royalties', async () => {
    const firstNftLauncherId = '0fbdbe7e1392f248f4ce3f8b1497496f056db6eb3856990ea3f697e28ec082c4';
    const secondNftLauncherId = '022a8c5c7c111111111111111111111111111111111111111111111111111111';
    mockGetWalletInfos.mockResolvedValue({});
    mockGetOfferSummary.mockResolvedValue(
      makeOfferSummary({
        offered: {
          [firstNftLauncherId]: '1',
          [secondNftLauncherId]: '1',
        },
        requested: {
          xch: '100000000',
        },
        infos: {
          [firstNftLauncherId]: {
            type: 'singleton',
            also: {
              type: 'metadata',
              also: {
                type: 'ownership',
                transfer_program: {
                  type: 'royalty transfer program',
                  royalty_percentage: '500',
                },
              },
            },
          },
          [secondNftLauncherId]: {
            type: 'singleton',
            also: {
              type: 'metadata',
              also: {
                type: 'ownership',
                transfer_program: {
                  type: 'royalty transfer program',
                  royalty_percentage: '10',
                },
              },
            },
          },
        },
      }),
    );
    mockNftGetInfo
      .mockResolvedValueOnce({
        success: true,
        nft_info: {
          data_uris: [],
          royalty_percentage: 500,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        nft_info: {
          data_uris: [],
          royalty_percentage: 10,
        },
      });

    await expect(
      parseCommandDisplay('chia_wallet.take_offer', {
        offer: 'offer1...',
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        spending: [
          {
            kind: 'xch',
            amount: '0.0001',
            amountWithRoyalties: '0.00010255',
          },
        ],
        receiving: [
          {
            kind: 'nft',
            royaltyPercentage: 500,
          },
          {
            kind: 'nft',
            royaltyPercentage: 10,
          },
        ],
      },
    });
  });

  it('uses offer summary infos to display CAT assets even if nft_get_info would succeed', async () => {
    const catAssetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';
    mockGetWalletInfos.mockResolvedValue({});
    mockGetOfferSummary.mockResolvedValue(
      makeOfferSummary({
        requested: {
          [catAssetId]: '1000',
        },
        infos: {
          [catAssetId]: {
            type: 'CAT',
          },
        },
      }),
    );
    mockNftGetInfo.mockResolvedValue({
      success: true,
      nft_info: {
        data_uris: ['https://example.com/not-used.png'],
      },
    });
    mockCatAssetIdToName.mockResolvedValue({ name: 'TEST' });

    await expect(
      parseCommandDisplay('chia_wallet.take_offer', {
        offer: 'offer1...',
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        spending: [
          {
            kind: 'cat',
            assetId: catAssetId,
            symbol: 'TEST',
          },
        ],
      },
    });
    expect(mockNftGetInfo).not.toHaveBeenCalled();
  });

  it('uses create-offer driver_dict to display singleton requested assets as NFTs', async () => {
    const nftLauncherId = '6b6b2a3b4c57c2b4596625583cbede95d081b59d18125fedb6b416a8ee46cfe5';
    mockGetWalletInfos.mockResolvedValue({});
    mockNftGetInfo.mockResolvedValue({
      success: false,
    });

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          [nftLauncherId]: '1',
        },
        driver_dict: {
          [nftLauncherId]: {
            type: 'singleton',
            launcher_id: `0x${nftLauncherId}`,
          },
        },
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        receiving: [
          {
            kind: 'nft',
          },
        ],
      },
    });
    expect(mockNftGetInfo).toHaveBeenCalledWith(nftLauncherId);
  });

  it('shows the create-offer fungible total with driver-provided NFT creator royalties', async () => {
    const nftLauncherId = '6b6b2a3b4c57c2b4596625583cbede95d081b59d18125fedb6b416a8ee46cfe5';
    mockGetWalletInfos.mockResolvedValue({
      1: { name: 'Chia', type: WalletType.STANDARD_WALLET },
    });
    mockNftGetInfo.mockResolvedValue({
      success: false,
    });

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          1: '-1000000000000',
          [nftLauncherId]: '1',
        },
        driver_dict: {
          [nftLauncherId]: {
            type: 'singleton',
            launcher_id: `0x${nftLauncherId}`,
            also: {
              type: 'metadata',
              also: {
                type: 'ownership',
                transfer_program: {
                  type: 'royalty transfer program',
                  royalty_percentage: '250',
                },
              },
            },
          },
        },
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        spending: [
          {
            kind: 'xch',
            amount: '1',
            amountWithRoyalties: '1.025',
          },
        ],
        receiving: [
          {
            kind: 'nft',
            royaltyPercentage: 250,
          },
        ],
      },
    });
  });

  it('uses create-offer driver_dict to display CAT requested assets as CATs', async () => {
    const catAssetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';
    mockGetWalletInfos.mockResolvedValue({});
    mockCatAssetIdToName.mockResolvedValue({ name: 'TEST' });

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          [catAssetId]: '1000',
        },
        driver_dict: {
          [catAssetId]: {
            type: 'CAT',
            tail: `0x${catAssetId}`,
          },
        },
      }),
    ).resolves.toMatchObject({
      walletDelta: {
        receiving: [
          {
            kind: 'cat',
            assetId: catAssetId,
            symbol: 'TEST',
          },
        ],
      },
    });
    expect(mockNftGetInfo).not.toHaveBeenCalled();
  });

  it('fails closed for unresolved create-offer spending-side bytes32 assets without drivers', async () => {
    const assetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';
    mockGetWalletInfos.mockResolvedValue({});

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          [assetId]: '-1000',
        },
      }),
    ).rejects.toThrow('Asset type is not valid');
    expect(mockCatAssetIdToName).not.toHaveBeenCalled();
    expect(mockNftGetInfo).not.toHaveBeenCalled();
  });

  it('fails closed for take-offer bytes32 assets missing offer summary type info', async () => {
    const assetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';
    mockGetWalletInfos.mockResolvedValue({});
    mockGetOfferSummary.mockResolvedValue(
      makeOfferSummary({
        requested: {
          [assetId]: '1000',
        },
      }),
    );

    await expect(
      parseCommandDisplay('chia_wallet.take_offer', {
        offer: 'offer1...',
      }),
    ).rejects.toThrow('Asset type is not valid');
    expect(mockCatAssetIdToName).not.toHaveBeenCalled();
    expect(mockNftGetInfo).not.toHaveBeenCalled();
  });

  it('rejects create-offer CAT drivers whose tail does not match the requested asset id', async () => {
    const requestedAssetId = '31ffd54c5b38bb33352dc0be0ebf9cf4f29a6329156dd4811d6f4254f85c8200';
    const driverTail = 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad';
    mockGetWalletInfos.mockResolvedValue({});

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          [requestedAssetId]: '1000',
        },
        driver_dict: {
          [requestedAssetId]: {
            type: 'CAT',
            tail: `0x${driverTail}`,
          },
        },
      }),
    ).rejects.toThrow('Driver Dict is not valid');
  });

  it('rejects create-offer singleton drivers whose launcher id does not match the requested asset id', async () => {
    const requestedAssetId = '6b6b2a3b4c57c2b4596625583cbede95d081b59d18125fedb6b416a8ee46cfe5';
    const driverLauncherId = 'd82dd03f8a9ad2f84353cd953c4de6b21dbaaf7de3ba3f4ddd9abe31ecba80ad';
    mockGetWalletInfos.mockResolvedValue({});

    await expect(
      parseCommandDisplay('chia_wallet.create_offer_for_ids', {
        offer: {
          [requestedAssetId]: '1',
        },
        driver_dict: {
          [requestedAssetId]: {
            type: 'singleton',
            launcher_id: `0x${driverLauncherId}`,
          },
        },
      }),
    ).rejects.toThrow('Driver Dict is not valid');
    expect(mockNftGetInfo).not.toHaveBeenCalled();
  });

  it('fails closed if a raw xch asset key reaches display parsing', async () => {
    const entriesSpy = jest
      .spyOn(Object, 'entries')
      .mockReturnValueOnce([['1', '-1']])
      .mockReturnValueOnce([['xch', 1n]])
      .mockReturnValueOnce([]);

    mockGetWalletInfos.mockResolvedValue({});

    try {
      await expect(
        parseCommandDisplay('chia_wallet.create_offer_for_ids', {
          offer: {
            1: '-1',
          },
        }),
      ).rejects.toThrow('XCH is not a valid asset ID');
    } finally {
      entriesSpy.mockRestore();
    }
  });

  it('fails closed if display parsing receives a non-string wallet delta key', async () => {
    const entriesSpy = jest
      .spyOn(Object, 'entries')
      .mockReturnValueOnce([['1', '-1']])
      .mockReturnValueOnce([[1 as unknown as string, 1n]])
      .mockReturnValueOnce([]);

    mockGetWalletInfos.mockResolvedValue({});

    try {
      await expect(
        parseCommandDisplay('chia_wallet.create_offer_for_ids', {
          offer: {
            1: '-1',
          },
        }),
      ).rejects.toThrow('Key is not a string');
    } finally {
      entriesSpy.mockRestore();
    }
  });

  it('fails closed if display parsing receives a non-bigint wallet delta value', async () => {
    const unsafeNumberValue = Number.MAX_SAFE_INTEGER + 1;
    const entriesSpy = jest
      .spyOn(Object, 'entries')
      .mockReturnValueOnce([['1', '-1']])
      .mockReturnValueOnce([['1', unsafeNumberValue as unknown as bigint]])
      .mockReturnValueOnce([]);

    mockGetWalletInfos.mockResolvedValue({});

    try {
      await expect(
        parseCommandDisplay('chia_wallet.create_offer_for_ids', {
          offer: {
            1: '-1',
          },
        }),
      ).rejects.toThrow('Value is not a bigint');
    } finally {
      entriesSpy.mockRestore();
    }
  });

  it('fails closed if display parsing receives a negative wallet delta value', async () => {
    const entriesSpy = jest
      .spyOn(Object, 'entries')
      .mockReturnValueOnce([['1', '-1']])
      .mockReturnValueOnce([['1', -1n]])
      .mockReturnValueOnce([]);

    mockGetWalletInfos.mockResolvedValue({});

    try {
      await expect(
        parseCommandDisplay('chia_wallet.create_offer_for_ids', {
          offer: {
            1: '-1',
          },
        }),
      ).rejects.toThrow('Value is not a positive bigint');
    } finally {
      entriesSpy.mockRestore();
    }
  });
});
