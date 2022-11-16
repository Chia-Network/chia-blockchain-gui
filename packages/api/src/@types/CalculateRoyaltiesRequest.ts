import RoyaltyCalculationFungibleAsset from './RoyaltyCalculationFungibleAsset';
import RoyaltyCalculationRoyaltyAsset from './RoyaltyCalculationRoyaltyAsset';

type CalculateRoyaltiesRequest = {
  royaltyAssets: RoyaltyCalculationRoyaltyAsset[];
  fungibleAssets: RoyaltyCalculationFungibleAsset[];
};

export default CalculateRoyaltiesRequest;
