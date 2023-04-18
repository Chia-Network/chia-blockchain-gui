import useHideObjectionableContent from './useHideObjectionableContent';
import useNFTFilter from './useNFTFilter';
import useNFTs from './useNFTs';

export default function useFilteredNFTs() {
  const filter = useNFTFilter();
  const [hideSensitiveContent, setHideSensitiveContent] = useHideObjectionableContent();

  const { search, visibility, types, walletIds, userFolder } = filter;

  const nftsResult = useNFTs({
    // filter props
    search,
    visibility,
    types,
    walletIds,
    userFolder,

    // additional props
    hideSensitiveContent,
  });

  return {
    ...filter,
    ...nftsResult,
    hideSensitiveContent,
    setHideSensitiveContent,
  };
}
