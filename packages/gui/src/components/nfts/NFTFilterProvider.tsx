import React, { createContext, useCallback, useMemo, useState } from 'react';

export interface NFTFilterContextData {
  getWalletId: () => number | undefined;
  getTypeFilter: () => string[];
  getVisibilityFilters: () => string[];
  getSearchFilter: () => string;

  setWalletId: (value: number | undefined) => void;
  setTypeFilter: (value: string[]) => void;
  setVisibilityFilters: (value: string[]) => void;
  setSearchFilter: (value: string) => void;
}

export const NFTFilterContext = createContext<NFTFilterContextData | undefined>(undefined);

export type NFTFilterProviderProps = {
  children?: React.ReactNode;
};

export default function NFTFilterProvider(props: NFTFilterProviderProps) {
  const { children } = props;

  const [walletId, setWalletId] = useState<number | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [visibilityFilters, setVisibilityFilters] = useState<string[]>(['visible']);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const getWalletId = useCallback(() => walletId, [walletId]);
  const getTypeFilter = useCallback(() => typeFilter, [typeFilter]);
  const getVisibilityFilters = useCallback(() => visibilityFilters, [visibilityFilters]);
  const getSearchFilter = useCallback(() => searchFilter, [searchFilter]);

  const value: NFTFilterContextData = useMemo(
    () => ({
      getWalletId,
      getTypeFilter,
      getVisibilityFilters,
      getSearchFilter,

      setWalletId,
      setTypeFilter,
      setVisibilityFilters,
      setSearchFilter,
    }),
    [
      getWalletId,
      getTypeFilter,
      getVisibilityFilters,
      getSearchFilter,
      setWalletId,
      setTypeFilter,
      setVisibilityFilters,
      setSearchFilter,
    ]
  );

  return <NFTFilterContext.Provider value={value}>{children}</NFTFilterContext.Provider>;
}
