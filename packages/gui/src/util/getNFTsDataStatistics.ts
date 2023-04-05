import FileType from '../@types/FileType';
import type NFTData from '../@types/NFTData';
import type NFTsDataStatistics from '../@types/NFTsDataStatistics';
import hasSensitiveContent from './hasSensitiveContent';

export default function getNFTsDataStatistics(
  data: NFTData[],
  isHidden: (nftId: string) => boolean
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
    const { type, metadata } = item;
    stats[type] = (stats[type] ?? 0) + 1;

    if (isHidden(item.nft.$nftId)) {
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
