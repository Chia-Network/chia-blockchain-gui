import type NFTData from '../@types/NFTData';
import type NFTsDataStatistics from '../@types/NFTsDataStatistics';
import FileType from '../constants/FileType';
import hasSensitiveContent from './hasSensitiveContent';

export default function getNFTsDataStatistics(
  data: NFTData[],
  isHidden: (nftId: string) => boolean,
  fingerprint: number | undefined,
  userFolder: string | undefined,
  userFoldersNFTs: any
): NFTsDataStatistics {
  const stats: NFTsDataStatistics = {
    [FileType.IMAGE]: 0,
    [FileType.VIDEO]: 0,
    [FileType.AUDIO]: 0,
    [FileType.DOCUMENT]: 0,
    [FileType.MODEL]: 0,
    [FileType.UNKNOWN]: 0,
    visible: 0,
    hidden: 0,
    total: 0,
    sensitive: 0,
  };

  data.forEach((item) => {
    const { nft, type, metadata } = item;

    if (userFolder && fingerprint && userFoldersNFTs?.[fingerprint]?.[userFolder]?.indexOf(nft?.$nftId) === -1) {
      return;
    }

    if (type) {
      stats[type] = (stats[type] ?? 0) + 1;
    }

    if (nft && isHidden(nft.$nftId)) {
      stats.hidden += 1;
    } else {
      stats.visible += 1;
    }

    if (!metadata || hasSensitiveContent(metadata)) {
      stats.sensitive += 1;
    }

    stats.total += 1;
  });

  return stats;
}
