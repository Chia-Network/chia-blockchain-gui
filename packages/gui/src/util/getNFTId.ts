import { launcherIdToNFTId } from './nfts';
import removeHexPrefix from './removeHexPrefix';

// id can be a launcher id or an nft id
export default function getNFTId(id: string) {
  const sanitizedId = id.trim();

  try {
    const isNFTId = sanitizedId.startsWith('nft');
    return isNFTId ? sanitizedId : launcherIdToNFTId(removeHexPrefix(sanitizedId));
  } catch {
    return id;
  }
}
