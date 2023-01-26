import { store, walletApi } from '@chia-network/api-react';
import isURL from 'validator/lib/isURL';

import OfferServices from '../constants/OfferServices';
import getRemoteFileContent from './getRemoteFileContent';
import offerToOfferBuilderData from './offerToOfferBuilderData';

export default async function fetchOffer(offerUrl: string) {
  if (!offerUrl || !isURL(offerUrl)) {
    throw new Error(`URL is not valid: ${offerUrl}`);
  }

  const domain = new URL(offerUrl).hostname;
  const service = OfferServices.find(({ domains }) => domains.includes(domain));
  if (!service) {
    throw new Error('Service not found');
  }

  const { data: offerData } = await getRemoteFileContent({
    uri: offerUrl,
    maxSize: 10 * 1024 * 1024, // 10 MB
    nftId: offerUrl,
    dataHash: 'no hash',
  });

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
  const { valid, success: isValiditySuccess, id } = dataOfferValidity;
  resultOfferValidityPromise.unsubscribe();
  if (!isValiditySuccess) {
    throw new Error('Failed to check offer validity');
  }

  // fetch offer record
  let tradeRecord;
  if (id) {
    const resultOfferRecordPromise = store.dispatch(walletApi.endpoints.getOfferRecord.initiate(id));
    const { data: dataOfferRecord, error: errorOfferRecord } = await resultOfferRecordPromise;
    if (!errorOfferRecord) {
      const { success: isOfferRecordSuccess } = dataOfferRecord;
      resultOfferRecordPromise.unsubscribe();
      if (!isOfferRecordSuccess) {
        throw new Error('Failed to get offer record');
      }

      tradeRecord = dataOfferRecord.tradeRecord;
    }
  }

  const offer = offerToOfferBuilderData(offerSummary);

  return {
    valid,
    offer,
    offerData,
    offerSummary,
    tradeRecord,
  };
}
