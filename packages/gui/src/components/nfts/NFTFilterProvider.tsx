import React, { createContext, useMemo, useState, type ReactNode } from 'react';

import FileType from '../../@types/FileType';
import NFTVisibility from '../../@types/NFTVisibility';

export interface NFTFilterContextData {
  walletIds: number[];
  types: FileType[];
  visibility: NFTVisibility;
  search: string | undefined;
  userFolder: string | null;

  setWalletIds: (value: number[]) => void;
  setTypes: (value: FileType[]) => void;
  setVisibility: (value: NFTVisibility) => void;
  setSearch: (value: string | undefined) => void;
  setUserFolder: (value: string | null) => void;
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
  const [userFolder, setUserFolder] = useState(null);

  const value = useMemo(
    () => ({
      walletIds,
      types,
      visibility,
      search,
      userFolder,

      setWalletIds,
      setTypes,
      setVisibility,
      setSearch,
      setUserFolder,
    }),
    [walletIds, types, visibility, search, userFolder, setWalletIds, setTypes, setVisibility, setSearch, setUserFolder]
  );

  return <NFTFilterContext.Provider value={value}>{children}</NFTFilterContext.Provider>;
}
