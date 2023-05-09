import { isValidNFTId, launcherIdToNFTId, launcherIdFromNFTId, convertRoyaltyToPercentage } from './nfts';

describe('isValidNFTId', () => {
  it('returns true for valid NFT ID', () => {
    expect(isValidNFTId('nft1k9c4cwmyctwzf57xzfaaghm20erdz23wzz3jsg0uwyft7qx5eeeqq4n93s')).toBe(true);
  });
});

describe('launcherIdToNFTId', () => {
  it('converts launcher ID to NFT ID', () => {
    expect(launcherIdToNFTId('0xb1715c3b64c2dc24d3c6127bd45f6a7e46d12a2e10a32821fc7112bf00d4ce72')).toBe(
      'nft1k9c4cwmyctwzf57xzfaaghm20erdz23wzz3jsg0uwyft7qx5eeeqq4n93s'
    );
  });
});

describe('launcherIdFromNFTId', () => {
  it('converts NFT ID to launcher ID', () => {
    expect(launcherIdFromNFTId('nft1k9c4cwmyctwzf57xzfaaghm20erdz23wzz3jsg0uwyft7qx5eeeqq4n93s')).toBe(
      'b1715c3b64c2dc24d3c6127bd45f6a7e46d12a2e10a32821fc7112bf00d4ce72'
    );
  });

  it('returns undefined for invalid NFT ID', () => {
    expect(launcherIdFromNFTId('nft1badid')).toBe(undefined);
  });
});

describe('convertRoyaltyToPercentage', () => {
  it('converts royalty to percentage', () => {
    expect(convertRoyaltyToPercentage(100)).toBe(1.0);
  });
});
