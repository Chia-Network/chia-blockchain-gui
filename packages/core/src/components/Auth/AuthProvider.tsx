import { useClearCache, useLogInMutation, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import React, { useMemo, useCallback, useRef, useState, useEffect, createContext, type ReactNode } from 'react';

export const AuthContext = createContext<
  | {
      logIn: (fingerprint: number) => Promise<void>;
      logOut: () => Promise<void>;
      fingerprint?: number;
      isLoading: boolean;
    }
  | undefined
>(undefined);

export type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider(props: AuthProviderProps) {
  const { children } = props;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fingerprint, setFingerprint] = useState<number | undefined>();
  const { data: currentFingerprint } = useGetLoggedInFingerprintQuery();
  const [logIn] = useLogInMutation();
  const clearCache = useClearCache();

  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const processNewFingerprint = useCallback(
    async (newFingerprint: number) => {
      if (!isLoadingRef.current) {
        try {
          setIsLoading(true);
          await clearCache();
          setFingerprint(newFingerprint);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [clearCache]
  );

  // automatically log in if we have a fingerprint already and logIn is not in progress
  useEffect(() => {
    if (!!currentFingerprint && currentFingerprint !== fingerprint) {
      processNewFingerprint(currentFingerprint);
    }
  }, [currentFingerprint, fingerprint, processNewFingerprint]);

  // immutable
  const handleLogOut = useCallback(async () => {
    // do nothing until backend change API,
    // user is still logged in and syncing with previously selected fingerprint
  }, []);

  // immutable
  const handleLogIn = useCallback(
    async (logInFingerprint: number) => {
      try {
        if (isLoadingRef.current) {
          return;
        }

        setIsLoading(true);

        handleLogOut();

        await logIn({
          fingerprint: logInFingerprint,
          type: 'skip',
        }).unwrap();

        // all data are from previous fingerprint, so we need to clear cache,
        // invalidateTags just do refetch and showing old data until new data are fetched
        await clearCache();
        setFingerprint(logInFingerprint);
      } finally {
        setIsLoading(false);
      }
    },
    [handleLogOut, logIn, clearCache]
  );

  const context = useMemo(
    () => ({
      logIn: handleLogIn,
      logOut: handleLogOut,
      fingerprint,
      isLoading,
    }),
    [handleLogIn, handleLogOut, fingerprint, isLoading]
  );

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>;
}
