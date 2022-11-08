import Response from './Response';
import RoyaltyCalculationFungibleAssetPayout from './RoyaltyCalculationFungibleAssetPayout';

type CalculateRoyaltiesResponse = Response & {
  royalties: {
    [key: string]: RoyaltyCalculationFungibleAssetPayout[];
  };
};

export default CalculateRoyaltiesResponse;
