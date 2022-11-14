import { useCallback, useRef, useMemo } from 'react';
import { useLocalStorage } from '@chia/api-react';
import type Pair from '../@types/Pair';
import { forEach } from 'lodash';

export default function useWalletConnectPairs() {
  const [_pairs, setPairs] = useLocalStorage<Pair[]>('walletConnectPairs', []);
  const pairsRef = useRef<Pair[]>(_pairs);

  pairsRef.current = _pairs;

  const updatePair = useCallback(
    (
      topic: string,
      data: Partial<Omit<Pair, 'topic'>> | ((pair: Pair) => Pair),
    ) => {
      setPairs((pairs: Pair[]) => {
        const index = pairs.findIndex((item) => item.topic === topic);
        if (index === -1) {
          return pairs;
        }

        const oldPair = pairs[index];
        const newPairing =
          typeof data === 'function' ? data(oldPair) : { ...oldPair, ...data };
        const newPairings = [...pairs];
        newPairings[index] = newPairing;

        return newPairings;
      });
    },
    [setPairs],
  );

  const removePair = useCallback(
    (topic: string) => {
      setPairs((pairs: Pair[]) => {
        return pairs.filter((item) => item.topic !== topic);
      });
    },
    [setPairs],
  );

  const removePairBySession = useCallback(
    (session: string) => {
      setPairs((pairs: Pair[]) => {
        return pairs.filter((item) => !item.sessions.includes(session));
      });
    },
    [setPairs],
  );

  const getPair = useCallback((topic: string) => {
    const pairs = pairsRef.current;
    return pairs.find((item) => item.topic === topic);
  }, []);

  const getPairBySession = useCallback((session: string) => {
    const pairs = pairsRef.current;
    return pairs.find((item) => item.sessions?.includes(session));
  }, []);

  const addPair = useCallback(
    (pair: Pair) => {
      setPairs((pairs: Pair[]) => {
        const index = pairs.findIndex((item) => item.topic === pair.topic);
        if (index !== -1) {
          throw new Error('Pair already exists');
        }

        return [...pairs, pair];
      });
    },
    [setPairs],
  );

  const removeSessionFromPair = useCallback(
    (session: string) => {
      setPairs((pairs: Pair[]) => {
        return pairs.map((pair) => ({
          ...pair,
          sessions: pair.sessions.filter((item) => item !== session),
        }));
      });
    },
    [setPairs],
  );

  const hasPair = useCallback(
    (topic: string) => {
      return !!getPair(topic);
    },
    [getPair],
  );

  const get = useCallback(() => pairsRef.current, []);

  const pairs = useMemo(() => {
    return {
      addPair,
      getPair,
      updatePair,
      removePair,
      hasPair,

      get,

      getPairBySession,
      removePairBySession,

      removeSessionFromPair,
    };
  }, [
    addPair,
    getPair,
    hasPair,
    updatePair,
    removePair,
    get,
    getPairBySession,
    removePairBySession,
    removeSessionFromPair,
  ]);

  return pairs;
}
