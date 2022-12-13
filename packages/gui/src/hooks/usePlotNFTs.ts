import type { PlotNFT } from '@chia-network/api';
import { useGetPlotNFTsQuery } from '@chia-network/api-react';
import PlotNFTExternal from 'types/PlotNFTExternal';

import useUnconfirmedPlotNFTs from './useUnconfirmedPlotNFTs';

export default function usePlotNFTs(): {
  loading: boolean;
  nfts?: PlotNFT[];
  external?: PlotNFTExternal[];
  error?: Error;
} {
  const {
    data,
    isLoading: isLoadingGetPlotNFTs,
    error,
  } = useGetPlotNFTsQuery(undefined, {
    pollingInterval: 10_000,
  });

  const { isLoading: isLoadingUnconfirmedPlotNFTs } = useUnconfirmedPlotNFTs();
  const isLoading = isLoadingGetPlotNFTs || isLoadingUnconfirmedPlotNFTs;

  /*
  function removeConfirmed() {
    if (isLoading) {
      return;
    }


  }

  console.log('nfts', data?.nfts);

  useEffect(() => {
    removeConfirmed();
  }, [data?.nfts, unconfirmed, isLoading]);
  */

  return {
    loading: isLoading,
    nfts: data?.nfts,
    external: data?.external,
    error,
  };
}
