import useHideObjectionableContent from './useHideObjectionableContent';
import useNFTFilter from './useNFTFilter';
import useNFTs from './useNFTs';

export default function useFilteredNFTs() {
  const filter = useNFTFilter();
  const [hideSensitiveContent, setHideSensitiveContent] = useHideObjectionableContent();

  const { search, visibility, previewAvailability, types, walletIds } = filter;

  const nftsResult = useNFTs({
    // filter props
    search,
    visibility,
    previewAvailability,
    types,
    walletIds,

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
