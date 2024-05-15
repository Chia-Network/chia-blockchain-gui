import React, { createContext, useMemo, useState, type ReactNode } from 'react';

import NFTVisibility from '../../@types/NFTVisibility';
import FileType from '../../constants/FileType';

export interface NFTFilterContextData {
  walletIds: number[];
  types: FileType[];
  visibility: NFTVisibility;
  search: string | undefined;

  setWalletIds: (value: number[]) => void;
  setTypes: (value: FileType[]) => void;
  setVisibility: (value: NFTVisibility) => void;
  setSearch: (value: string | undefined) => void;
}

export const NFTFilterContext = createContext<NFTFilterContextData | undefined>(undefined);

export type NFTFilterProviderProps = {
  children?: ReactNode;
};

export default function NFTFilterProvider(props: NFTFilterProviderProps) {
  const { children } = props;

  const [walletIds, setWalletIds] = useState<number[]>([]);
  const [types, setTypes] = useState<FileType[]>([
    FileType.AUDIO,
    FileType.IMAGE,
    FileType.VIDEO,
    FileType.DOCUMENT,
    FileType.MODEL,
    FileType.UNKNOWN,
  ]);
  const [visibility, setVisibility] = useState<NFTVisibility>(NFTVisibility.ALL);
  const [search, setSearch] = useState('');

  const value = useMemo(
    () => ({
      walletIds,
      types,
      visibility,
      search,

      setWalletIds,
      setTypes,
      setVisibility,
      setSearch,
    }),
    [walletIds, types, visibility, search, setWalletIds, setTypes, setVisibility, setSearch],
  );

  return <NFTFilterContext.Provider value={value}>{children}</NFTFilterContext.Provider>;
}
