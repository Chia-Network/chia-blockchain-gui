import { store, walletApi } from '@chia-network/api-react';
import isURL from 'validator/lib/isURL';

import OfferServices from '../constants/OfferServices';
import getRemoteFileContent from './getRemoteFileContent';
import offerToOfferBuilderData from './offerToOfferBuilderData';

const cache: Record<string, string> = {};

export default async function fetchOffer(offerUrl: string) {
  if (!offerUrl || !isURL(offerUrl)) {
    throw new Error(`URL is not valid: ${offerUrl}`);
  }

  const domain = new URL(offerUrl).hostname;
  const service = OfferServices.find(({ domains }) => domains.find((localDomain) => domain.endsWith(localDomain)));
  if (!service) {
    throw new Error('Service not found');
  }

  if (!cache[offerUrl]) {
    const { data } = await getRemoteFileContent({
      uri: offerUrl,
      maxSize: 10 * 1024 * 1024, // 10 MB
      nftId: offerUrl,
      dataHash: 'no hash',
    });

    cache[offerUrl] = data;
  }

  const offerData = cache[offerUrl];

  if (!offerData) {
    throw new Error('Failed to get offer data');
  }

  // fetch offer summary
  const resultOfferSummaryPromise = store.dispatch(walletApi.endpoints.getOfferSummary.initiate(offerData));
  const { data: dataOfferSummary, error: errorOfferSummary } = await resultOfferSummaryPromise;
  if (errorOfferSummary) {
    throw errorOfferSummary;
  }

  const { summary: offerSummary, success } = dataOfferSummary;
  resultOfferSummaryPromise.unsubscribe();
  if (!success) {
    throw new Error('Failed to get offer summary');
  }

  // check offer validity
  const resultOfferValidityPromise = store.dispatch(walletApi.endpoints.checkOfferValidity.initiate(offerData));
  const { data: dataOfferValidity, error: errorOfferValidity } = await resultOfferValidityPromise;
  if (errorOfferValidity) {
    throw errorOfferValidity;
  }

  const { valid, success: isValiditySuccess, id: offerId } = dataOfferValidity;
  resultOfferValidityPromise.unsubscribe();
  if (!isValiditySuccess) {
    throw new Error('Failed to check offer validity');
  }

  const offer = offerToOfferBuilderData(offerSummary, true);

  /*
  // get trade record
  let tradeRecord;
  if (offerId) {
    const resultOfferRecordPromise = store.dispatch(walletApi.endpoints.getOfferRecord.initiate(offerId));
    const { data: dataTradeRecord, error: errorTradeRecord } = await resultOfferRecordPromise;
    if (!errorTradeRecord) {
      tradeRecord = dataTradeRecord.data;
    }

    resultOfferRecordPromise.unsubscribe();
  }
  */

  return {
    valid,
    offer,
    offerData,
    offerSummary,
    offerId,
    // isMyOffer: tradeRecord?.is_my_offer,
  };
}
