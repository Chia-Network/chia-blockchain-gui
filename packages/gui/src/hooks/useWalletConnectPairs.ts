import { useLocalStorage } from '@chia-network/api-react';
import { useCallback, useRef, useMemo } from 'react';

import type Pair from '../@types/Pair';

type PairCallback = (pairs: Pair[]) => Pair[];

export type Pairs = {
  addPair: (pair: Pair) => void;
  getPair: (topic: string) => Pair | undefined;
  updatePair: (topic: string, pair: Partial<Pair> | ((pair: Pair) => Pair)) => void;
  removePair: (topic: string) => void;
  hasPair: (topic: string) => boolean;

  get: () => Pair[];

  getPairBySession: (sessionTopic: string) => Pair | undefined;
  removePairBySession: (sessionTopic: string) => void;

  removeSessionFromPair: (sessionTopic: string) => void;

  bypassCommand: (sessionTopic: string, command: string, confirm: boolean) => void;
  removeBypassCommand: (sessionTopic: string, command: string) => void;
  resetBypassForAllPairs: () => void;
  resetBypassForPair: (pairTopic: string) => void;
};

export default function useWalletConnectPairs(): Pairs {
  const localStorageData = useLocalStorage<Pair[]>('walletConnectPairs', []);
  const [currentPairs] = localStorageData;

  const pairsRef = useRef<[Pair[], (pairs: Pair[] | PairCallback) => void]>(localStorageData);
  pairsRef.current = localStorageData;

  const updatePair = useCallback((topic: string, data: Partial<Omit<Pair, 'topic'>> | ((pair: Pair) => Pair)) => {
    const [, setPairs] = pairsRef.current;
    setPairs((pairs: Pair[]) => {
      const index = pairs.findIndex((item) => item.topic === topic);
      if (index === -1) {
        return pairs;
      }

      const oldPair = pairs[index];
      const newPairing = typeof data === 'function' ? data(oldPair) : { ...oldPair, ...data };
      const newPairings = [...pairs];
      newPairings[index] = newPairing;

      return newPairings;
    });
  }, []);

  const removePair = useCallback((topic: string) => {
    const [, setPairs] = pairsRef.current;
    setPairs((pairs: Pair[]) => pairs.filter((item) => item.topic !== topic));
  }, []);

  const removePairBySession = useCallback((sessionTopic: string) => {
    const [, setPairs] = pairsRef.current;
    setPairs((pairs: Pair[]) =>
      pairs.filter((item) => !item.sessions.find((session) => session.topic === sessionTopic))
    );
  }, []);

  const getPair = useCallback((topic: string) => {
    const [pairs] = pairsRef.current;
    return pairs.find((item) => item.topic === topic);
  }, []);

  const hasPair = useCallback((topic: string) => {
    const [pairs] = pairsRef.current;
    return !!pairs.find((item) => item.topic === topic);
  }, []);

  const getPairBySession = useCallback((sessionTopic: string) => {
    const [pairs] = pairsRef.current;
    return pairs.find((item) => item.sessions?.find((session) => session.topic === sessionTopic));
  }, []);

  const addPair = useCallback((pair: Pair) => {
    const [, setPairs] = pairsRef.current;
    setPairs((pairs: Pair[]) => {
      const index = pairs.findIndex((item) => item.topic === pair.topic);
      if (index !== -1) {
        throw new Error('Pair already exists');
      }

      return [...pairs, pair];
    });
  }, []);

  const removeSessionFromPair = useCallback((sessionTopic: string) => {
    const [, setPairs] = pairsRef.current;
    setPairs((pairs: Pair[]) =>
      pairs.map((pair) => ({
        ...pair,
        sessions: pair.sessions.filter((item) => item.topic !== sessionTopic),
      }))
    );
  }, []);

  const get = useCallback(() => pairsRef.current[0], []);

  const bypassCommand = useCallback((sessionTopic: string, command: string, confirm: boolean) => {
    const [, setPairs] = pairsRef.current;
    setPairs((pairs: Pair[]) => {
      const pair = pairs.find((item) => item.sessions?.find((session) => session.topic === sessionTopic));
      if (!pair) {
        throw new Error('Pair not found');
      }

      return pairs.map((item) => ({
        ...item,
        bypassCommands:
          item.topic === pair.topic
            ? {
                ...item.bypassCommands,
                [command]: confirm,
              }
            : item.bypassCommands,
      }));
    });
  }, []);

  const removeBypassCommand = useCallback((sessionTopic: string, command: string) => {
    const deleteCommand = (commands: Record<string, boolean> | undefined) => {
      const newBypassCommands = { ...commands };
      delete newBypassCommands[command];
      return newBypassCommands;
    };

    const [, setPairs] = pairsRef.current;
    setPairs((pairs: Pair[]) => {
      const pair = pairs.find((item) => item.sessions?.find((session) => session.topic === sessionTopic));
      if (!pair) {
        throw new Error('Pair not found');
      }

      return pairs.map((item) => ({
        ...item,
        bypassCommands:
          item.topic === pair.topic && command in (item.bypassCommands ?? {})
            ? deleteCommand(item.bypassCommands)
            : item.bypassCommands,
      }));
    });
  }, []);

  const resetBypassForAllPairs = useCallback(() => {
    const [, setPairs] = pairsRef.current;

    setPairs((pairs: Pair[]) =>
      pairs.map((item) => ({
        ...item,
        bypassCommands: {},
      }))
    );
  }, []);

  const resetBypassForPair = useCallback((pairTopic: string) => {
    const [, setPairs] = pairsRef.current;

    setPairs((pairs: Pair[]) =>
      pairs.map((item) => ({
        ...item,
        bypassCommands:
          item.topic === pairTopic
            ? {} // reset bypass commands
            : item.bypassCommands,
      }))
    );
  }, []);

  const pairs = useMemo(
    () => ({
      addPair,
      getPair,
      updatePair,
      removePair,
      hasPair,

      get,

      getPairBySession,
      removePairBySession,

      removeSessionFromPair,
      bypassCommand,
      removeBypassCommand,
      resetBypassForAllPairs,
      resetBypassForPair,
      pairs: currentPairs,
    }),
    [
      addPair,
      getPair,
      hasPair,
      updatePair,
      removePair,
      get,
      getPairBySession,
      removePairBySession,
      removeSessionFromPair,
      bypassCommand,
      removeBypassCommand,
      resetBypassForAllPairs,
      resetBypassForPair,
      currentPairs,
    ]
  );

  return pairs;
}
