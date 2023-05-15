import { store, walletApi } from '@chia-network/api-react';
import BigNumber from 'bignumber.js';

import { prepareNFTOffer, prepareNFTOfferFromNFTId } from './prepareNFTOffer';

jest.mock('@chia-network/api-react', () => ({
  store: {
    dispatch: jest.fn(),
  },
  walletApi: {
    endpoints: {
      getNFTInfo: {
        initiate: jest.fn(),
      },
    },
  },
}));

describe('prepareNFTOfferFromNFTId', () => {
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    (store.dispatch as any).mockReset();
    (walletApi.endpoints.getNFTInfo.initiate as any).mockReset();
    mockUnsubscribe = jest.fn();
  });

  it('throws an error if launcherId is invalid', async () => {
    expect.assertions(1);
    const nftId = 'invalid_nft_id';

    await expect(prepareNFTOfferFromNFTId(nftId, true)).rejects.toThrowError('Invalid NFT ID');
  });

  it("throws an error if getNFTInfo doesn't find the NFT", async () => {
    expect.assertions(1);
    const nftId = 'nft1sy37ezgaqjzg3mg3pwhltvz8ukc3uh9yaeagrs46qj4l8mdy7pmsun32tp';

    (store.dispatch as any).mockReturnValueOnce({
      data: null,
      unsubscribe: mockUnsubscribe,
    });

    await expect(prepareNFTOfferFromNFTId(nftId, true)).rejects.toThrowError('NFT not found');
  });

  it('throws an error if getNFTInfo returns an error', async () => {
    expect.assertions(1);
    const nftId = 'nft1sy37ezgaqjzg3mg3pwhltvz8ukc3uh9yaeagrs46qj4l8mdy7pmsun32tp';

    (store.dispatch as any).mockReturnValueOnce({
      error: new Error('getNFTInfo error'),
      unsubscribe: mockUnsubscribe,
    });

    await expect(prepareNFTOfferFromNFTId(nftId, true)).rejects.toThrowError('getNFTInfo error');
  });

  it('calls getNFTInfo with the correct parameters and return a prepared NFT offer', async () => {
    const nftId = 'nft1sy37ezgaqjzg3mg3pwhltvz8ukc3uh9yaeagrs46qj4l8mdy7pmsun32tp';
    const mockNFTData = {
      launcherId: '0x8123ec891d048488ed110baff5b047e5b11e5ca4ee7a81c2ba04abf3eda4f077',
      launcherPuzhash: '0x456',
      chainInfo: {},
      updaterPuzhash: '0x789',
      supportsDid: false,
      $nftId: nftId,
    };

    (store.dispatch as any).mockReturnValueOnce({
      data: mockNFTData,
      unsubscribe: mockUnsubscribe,
    });

    await prepareNFTOfferFromNFTId(nftId, true);

    expect(walletApi.endpoints.getNFTInfo.initiate).toHaveBeenCalledWith({
      coinId: '8123ec891d048488ed110baff5b047e5b11e5ca4ee7a81c2ba04abf3eda4f077',
    });
    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('prepareNFTOffer', () => {
  const nftInfo = {
    $nftId: 'nft1sy37ezgaqjzg3mg3pwhltvz8ukc3uh9yaeagrs46qj4l8mdy7pmsun32tp',
    launcherId: '0x8123ec891d048488ed110baff5b047e5b11e5ca4ee7a81c2ba04abf3eda4f077',
    launcherPuzhash: '0x456',
    chainInfo: {},
    updaterPuzhash: '0x789',
    supportsDid: false,
  };

  it('returns a prepared NFT offer with correct properties when offeredNFT is false', () => {
    const result = prepareNFTOffer(nftInfo as any, false);

    expect(result.nft).toEqual(nftInfo);
    expect(result.id).toBe('8123ec891d048488ed110baff5b047e5b11e5ca4ee7a81c2ba04abf3eda4f077');
    expect(result.amount).toEqual(new BigNumber(1));
    expect(result.driver).toBeTruthy();
    expect(result.driver!.type).toBe('singleton');
    expect(result.driver!.launcher_id).toBe(nftInfo.launcherId);
    expect(result.driver!.launcher_ph).toBe(nftInfo.launcherPuzhash);
  });

  it('returns a prepared NFT offer with correct properties when offeredNFT is true', () => {
    const result = prepareNFTOffer(nftInfo as any, true);

    expect(result.nft).toEqual(nftInfo);
    expect(result.id).toBe('8123ec891d048488ed110baff5b047e5b11e5ca4ee7a81c2ba04abf3eda4f077');
    expect(result.amount).toEqual(new BigNumber(-1));
    expect(result.driver).toBeUndefined();
  });

  it('includes the ownership field if nft.supportsDid is true', () => {
    const nftWithDidSupport = { ...nftInfo, supportsDid: true, royaltyPuzzleHash: '0xabc', royaltyPercentage: 10 };
    const result = prepareNFTOffer(nftWithDidSupport as any, false);

    expect(result.driver!.also.also).toBeTruthy();
    expect(result.driver!.also.also!.type).toBe('ownership');
    expect(result.driver!.also.also!.owner).toBe('()');
    expect(result.driver!.also.also!.transfer_program.type).toBe('royalty transfer program');
    expect(result.driver!.also.also!.transfer_program.launcher_id).toBe(nftWithDidSupport.launcherId);
    expect(result.driver!.also.also!.transfer_program.royalty_address).toBe(nftWithDidSupport.royaltyPuzzleHash);
    expect(result.driver!.also.also!.transfer_program.royalty_percentage).toBe(
      `${nftWithDidSupport.royaltyPercentage}`
    );
  });

  it('throws an error if the nftId is invalid', () => {
    const invalidNFTInfo = { ...nftInfo, $nftId: 'invalid_nft_id', launcherId: '0x789' };
    expect(() => prepareNFTOffer(invalidNFTInfo as any, false)).toThrowError('Invalid NFT ID');
  });
});
