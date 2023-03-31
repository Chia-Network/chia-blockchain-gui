import useHideObjectionableContent from './useHideObjectionableContent';
import useNFTFilter from './useNFTFilter';
import useNFTs from './useNFTs';

export default function useFilteredNFTs() {
  const filter = useNFTFilter();
  const [hideSensitiveContent, setHideSensitiveContent] = useHideObjectionableContent();

  const { search } = filter;

  const nftsResult = useNFTs({
    search,
    hideSensitiveContent,
  });

  return {
    ...filter,
    ...nftsResult,
    hideSensitiveContent,
    setHideSensitiveContent,
  };
}
