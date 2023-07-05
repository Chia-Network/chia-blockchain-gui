import { EventEmitter } from 'events';

import { useGetOfferSummaryMutation, useCheckOfferValidityMutation } from '@chia-network/api-react';
import { isValidURL } from '@chia-network/core';
import debug from 'debug';
import React, { useState, createContext, useMemo, useCallback, type ReactNode } from 'react';

import type Offer from '../../@types/Offer';
import type OfferOnDemand from '../../@types/OfferOnDemand';
import type OfferState from '../../@types/OfferState';
import OfferServices from '../../constants/OfferServices';
import useCache from '../../hooks/useCache';
import useWaitForWalletSync from '../../hooks/useWaitForWalletSync';
import limit from '../../util/limit';
import parseFileContent from '../../util/parseFileContent';

export const OffersContext = createContext<
  | {
      getOffer: (offerId: string | undefined) => OfferState;
      subscribeToChanges: (offerId: string | undefined, callback: (offerState: OfferState) => void) => () => void;
      invalidate: (offerId: string | undefined) => void;
    }
  | undefined
>(undefined);

const log = debug('chia-gui:OfferProvider');

export function getChangedEventName(id: string) {
  return `offerChanged:${id}`;
}

type OffersProviderProps = {
  children: ReactNode;
  concurrency?: number;
};

export default function OffersProvider(props: OffersProviderProps) {
  const { children, concurrency = 10 } = props;

  const [checkOfferValidity] = useCheckOfferValidityMutation();
  const [getOfferSummary] = useGetOfferSummaryMutation();
  const { getContent, getHeaders } = useCache();
  const events /* immutable */ = useMemo(() => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(1000);
    return eventEmitter;
  }, []);
  const waitForWalletSync = useWaitForWalletSync();

  const add /* immutable until concurrency change */ = useMemo(() => limit(concurrency), [concurrency]);
  const [offersOnDemand /* immutable */] = useState(() => new Map<string, OfferOnDemand>());

  // immutable function
  const setOffer = useCallback(
    (id: string, offerOnDemand: OfferOnDemand) => {
      log(`Setting offer on demand for ${id}`);

      offersOnDemand.set(id, offerOnDemand);

      events.emit(getChangedEventName(id), {
        offer: offerOnDemand.offer,
        error: offerOnDemand.error,
        isLoading: !!offerOnDemand.promise,
      });

      events.emit('changed');
    },
    [events /* immutable */, offersOnDemand /* immutable */]
  );

  // immutable function
  const prepareOfferData = useCallback(
    async (urlOrOfferData: string) => {
      if (!isValidURL(urlOrOfferData)) {
        return urlOrOfferData;
      }

      const domain = new URL(urlOrOfferData).hostname;
      const service = OfferServices.find(({ domains }) => domains.find((localDomain) => domain.endsWith(localDomain)));
      if (!service) {
        throw new Error('Service not found');
      }

      const headers = await getHeaders(urlOrOfferData, {
        maxSize: 10 * 1024 * 1024, // 10 MB
      });

      const content = await getContent(urlOrOfferData, {
        maxSize: 10 * 1024 * 1024, // 10 MB
      });

      const offerData = parseFileContent(content, headers);
      return offerData;
    },
    [getHeaders /* immutable */, getContent /* immutable */]
  );

  // immutable function
  const fetchOffer = useCallback(
    async (urlOrOfferData: string): Promise<Offer> => {
      const offerOnDemand = offersOnDemand.get(urlOrOfferData);
      if (offerOnDemand) {
        if (offerOnDemand.error) {
          throw offerOnDemand.error;
        }

        if (offerOnDemand.offer) {
          return offerOnDemand.offer;
        }

        if (offerOnDemand.promise) {
          return offerOnDemand.promise;
        }
      }

      async function limitedFetchOfferById() {
        try {
          log(`Fetching offer by ID ${urlOrOfferData} from API`);

          const data = await prepareOfferData(urlOrOfferData);

          await waitForWalletSync();

          // do it in parallel
          const [{ summary }, { valid, id: offerId }] = await Promise.all([
            getOfferSummary({ offerData: data }).unwrap(),
            checkOfferValidity({ offer: data }).unwrap(),
          ]);

          const offer = {
            id: offerId,
            valid,
            data,
            summary,
          };

          setOffer(urlOrOfferData, {
            offer,
          });

          return offer;
        } catch (e) {
          setOffer(urlOrOfferData, {
            error: e as Error,
          });

          throw e;
        }
      }

      const promise = add<Offer>(() => limitedFetchOfferById());

      setOffer(urlOrOfferData, {
        promise,
      });

      return promise;
    },
    [
      add /* immutable */,
      offersOnDemand /* immutable */,
      setOffer /* immutable */,
      prepareOfferData /* immutable */,
      getOfferSummary /* immutable */,
      checkOfferValidity /* immutable */,
      waitForWalletSync /* immutable */,
    ]
  );

  // immutable function
  const getOffer = useCallback(
    (id: string | undefined): OfferState => {
      if (!id) {
        return {
          offer: undefined,
          isLoading: false,
          error: new Error('Invalid NFT id'),
        };
      }

      const offerOnDemand = offersOnDemand.get(id);
      if (offerOnDemand) {
        return {
          offer: offerOnDemand.offer,
          isLoading: !!offerOnDemand.promise,
          error: offerOnDemand.error,
        };
      }

      fetchOffer(id).catch((e) => {
        log(`Error fetching offer for id: ${id}`, e);
      });

      return {
        offer: undefined,
        isLoading: true,
        error: undefined,
      };
    },
    [fetchOffer /* immutable */, offersOnDemand /* immutable */]
  );

  // immutable function
  const subscribeToChanges = useCallback(
    (id: string | undefined, callback: (offerState: OfferState) => void) => {
      if (!id) {
        return () => {};
      }

      const eventName = getChangedEventName(id);
      events.on(eventName, callback);

      return () => {
        events.off(eventName, callback);
      };
    },
    [events /* immutable */]
  );

  // immutable function
  const invalidate = useCallback(
    async (id: string | undefined) => {
      if (!id) {
        return;
      }

      const offerOnDemand = offersOnDemand.get(id);
      if (offerOnDemand) {
        // wait for the promise to resolve and ignore error
        if (offerOnDemand.promise) {
          await offerOnDemand.promise.catch(() => {});
        }

        offersOnDemand.delete(id);

        // reload metadata
        getOffer(id);
      }
    },
    [getOffer /* immutable */, offersOnDemand /* immutable */]
  );

  const context = useMemo(
    () => ({
      getOffer,
      invalidate,
      subscribeToChanges,
    }),
    [getOffer, subscribeToChanges, invalidate]
  );

  return <OffersContext.Provider value={context}>{children}</OffersContext.Provider>;
}
