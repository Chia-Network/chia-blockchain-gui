import { store, walletApi } from '@chia-network/api-react';
import { isValidURL } from '@chia-network/core';

import OfferServices from '../constants/OfferServices';
import offerToOfferBuilderData from './offerToOfferBuilderData';
import parseFileContent from './parseFileContent';

type FetchOfferParams = {
  offerUrl: string;
  getContent: (url: string, options?: { maxSize?: number; timeout?: number }) => Promise<Buffer>;
  getHeaders: (url: string, options?: { maxSize?: number; timeout?: number }) => Promise<Object>;
};

export default async function fetchOffer({ offerUrl, getContent, getHeaders }: FetchOfferParams) {
  if (!offerUrl || !isValidURL(offerUrl)) {
    throw new Error(`URL is not valid: ${offerUrl}`);
  }

  const domain = new URL(offerUrl).hostname;
  const service = OfferServices.find(({ domains }) => domains.find((localDomain) => domain.endsWith(localDomain)));
  if (!service) {
    throw new Error('Service not found');
  }

  const headers = await getHeaders(offerUrl, {
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  const content = await getContent(offerUrl, {
    maxSize: 10 * 1024 * 1024, // 10 MB
  });

  const offerData = parseFileContent(content, headers);

  if (!offerData) {
    throw new Error('Failed to get offer data');
  }

  // fetch offer summary
  const resultOfferSummaryPromise = store.dispatch(walletApi.endpoints.getOfferSummary.initiate({ offerData }));
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
  const resultOfferValidityPromise = store.dispatch(
    walletApi.endpoints.checkOfferValidity.initiate({ offer: offerData })
  );
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
