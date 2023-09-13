import type BigNumber from 'bignumber.js';

export type OfferSummaryAssetAndAmount = {
  [key: string]: BigNumber | number;
};

export type OfferSummaryAssetInfo = {
  type: 'CAT' | 'NFT';
};

export type OfferSummaryCATInfo = OfferSummaryAssetInfo & {
  tail: string;
  also?: {
    authorizedProviders: string[];
    flags: string[];
    proofsChecker: string;
    type: string;
  };
};

export type OfferSummaryNFTInfo = OfferSummaryAssetInfo & {
  launcherId: string;
};

export type OfferSummaryInfos = {
  [key: string]: OfferSummaryCATInfo | OfferSummaryNFTInfo;
};

export type OfferSummaryValidTimes = {
  [key: string]: number;
};

type OfferSummaryRecord = {
  offered: OfferSummaryAssetAndAmount;
  requested: OfferSummaryAssetAndAmount;
  infos: OfferSummaryInfos;
  fees: number;
  validTimes: OfferSummaryValidTimes;
};

export default OfferSummaryRecord;
