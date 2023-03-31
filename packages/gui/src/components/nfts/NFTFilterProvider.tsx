import React, { createContext, useMemo, useState, type ReactNode } from 'react';

import type FileType from '../../@types/FileType';

export interface NFTFilterContextData {
  walletId?: number;
  types?: string;
  visibility?: string[];
  search?: string;

  setWalletId: (value: number | undefined) => void;
  setTypes: (value: string[]) => void;
  setVisibility: (value: string[]) => void;
  setSearch: (value: string | undefined) => void;
}

export const NFTFilterContext = createContext<NFTFilterContextData | undefined>(undefined);

export type NFTFilterProviderProps = {
  children?: ReactNode;
};

export default function NFTFilterProvider(props: NFTFilterProviderProps) {
  const { children } = props;

  const [walletId, setWalletId] = useState<number | undefined>(undefined);
  const [types, setTypes] = useState<FileType[]>([]);
  const [visibility, setVisibility] = useState<string[]>(['visible']);
  const [search, setSearch] = useState('');

  const value = useMemo(
    () => ({
      walletId,
      types,
      visibility,
      search,

      setWalletId,
      setTypes,
      setVisibility,
      setSearch,
    }),
    [walletId, types, visibility, search, setWalletId, setTypes, setVisibility, setSearch]
  );

  return <NFTFilterContext.Provider value={value}>{children}</NFTFilterContext.Provider>;
}
