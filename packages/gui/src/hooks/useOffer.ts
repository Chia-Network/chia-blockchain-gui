import { type OfferSummaryRecord } from '@chia/api';
import { useGetOfferSummaryMutation, useCheckOfferValidityMutation } from '@chia/api-react';
import { useState, useEffect } from 'react';
import isURL from 'validator/lib/isURL';

import OfferServices from '../constants/OfferServices';
import getRemoteFileContent from '../util/getRemoteFileContent';
import offerToOfferBuilderData from '../util/offerToOfferBuilderData';

// test
// https://api.offerbin.io/download/HMUL8iRzS6RXy6gCXeyoi92UhNr2hMuBfwnqqRBoC3CE.offer

export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

export default function useOffer(url: string) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>();
  const [offerData, setOfferData] = useState<any | undefined>();
  const [offerSummary, setOfferSummary] = useState<OfferSummaryRecord | undefined>();
  const [isValid, setIsValid] = useState<boolean>(false);
  const [offer, setOffer] = useState<OfferBuilderData | undefined>();

  const [getOfferSummary] = useGetOfferSummaryMutation();
  const [checkOfferValidity] = useCheckOfferValidityMutation();

  async function fetchOffer(offerUrl: string) {
    try {
      setIsLoading(true);
      if (!url || !isURL(offerUrl)) {
        throw new Error(`URL is not valid: ${offerUrl}`);
      }

      const domain = new URL(offerUrl).hostname;
      const service = OfferServices.find((service) => service.domains.includes(domain));
      if (!service) {
        throw new Error('Service not found');
      }

      const { label } = service;
      console.log(label, offerUrl);

      // fetch offer data
      const { data } = await getRemoteFileContent({
        uri: offerUrl,
        maxSize: MAX_FILE_SIZE,
        nftId: offerUrl,
        dataHash: 'no hash',
      });

      console.log('offer data', data);

      if (!data) {
        throw new Error('Failed to get offer data');
      }

      setOfferData(data);

      const { summary, success } = await getOfferSummary(data).unwrap();
      if (!success) {
        throw new Error('Failed to get offer summary');
      }

      console.log('offer summary', summary);
      setOfferSummary(summary);

      const { valid, success: isValiditySuccess } = await checkOfferValidity(data).unwrap();
      if (!isValiditySuccess) {
        throw new Error('Failed to check offer validity');
      }

      setIsValid(valid);

      console.log('offer validityResponse', valid);

      setOffer(offerToOfferBuilderData(summary));
    } catch (e) {
      console.log('error', e);
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOffer(url);
  }, [url]);

  return { isLoading, error, offer, offerData, offerSummary, isValid };
}
