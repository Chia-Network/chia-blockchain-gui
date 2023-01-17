import { store, walletApi } from '@chia/api-react';
import isURL from 'validator/lib/isURL';

import OfferServices from '../constants/OfferServices';
import getRemoteFileContent from './getRemoteFileContent';
import offerToOfferBuilderData from './offerToOfferBuilderData';

// test
// https://api.offerbin.io/download/HMUL8iRzS6RXy6gCXeyoi92UhNr2hMuBfwnqqRBoC3CE.offer

export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

export default async function fetchOffer(offerUrl: string) {
  if (!offerUrl || !isURL(offerUrl)) {
    throw new Error(`URL is not valid: ${offerUrl}`);
  }

  const domain = new URL(offerUrl).hostname;
  const service = OfferServices.find((service) => service.domains.includes(domain));
  if (!service) {
    throw new Error('Service not found');
  }

  const { data: offerData } = await getRemoteFileContent({
    uri: offerUrl,
    maxSize: MAX_FILE_SIZE,
    nftId: offerUrl,
    dataHash: 'no hash',
  });

  if (!offerData) {
    throw new Error('Failed to get offer data');
  }

  // fetch offer summary
  const resultOfferSummaryPromise = store.dispatch(walletApi.endpoints.getOfferSummary.initiate(offerData));
  const {
    data: { summary: offerSummary, success },
  } = await resultOfferSummaryPromise;
  resultOfferSummaryPromise.unsubscribe();
  if (!success) {
    throw new Error('Failed to get offer summary');
  }

  // check offer validity
  const resultOfferValidityPromise = store.dispatch(walletApi.endpoints.checkOfferValidity.initiate(offerData));
  const {
    data: { valid, success: isValiditySuccess },
  } = await resultOfferValidityPromise;
  resultOfferValidityPromise.unsubscribe();
  if (!isValiditySuccess) {
    throw new Error('Failed to check offer validity');
  }

  /*
  console.log('offer', offerData, offerSummary);

  // get offer record
  const resultOfferRecordPromise = store.dispatch(walletApi.endpoints.getOfferRecord.initiate(offerData));
  const {
    data: { success: isOfferRecordSuccess, ...rest },
  } = await resultOfferRecordPromise;
  console.log('rest', success, rest);
  resultOfferRecordPromise.unsubscribe();
  if (!isOfferRecordSuccess) {
    throw new Error('Failed to check offer record');
  }
  */

  const offer = offerToOfferBuilderData(offerSummary);

  return {
    valid,
    offer,
    offerData,
    offerSummary,
    // rest,
  };
}
