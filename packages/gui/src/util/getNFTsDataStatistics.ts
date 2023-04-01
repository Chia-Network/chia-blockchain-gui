import { type NFTInfo } from '@chia-network/api';

import FileType from '../@types/FileType';
import type NFTData from '../@types/NFTData';
import type NFTsDataStatistics from '../@types/NFTsDataStatistics';

export default function getNFTsDataStatistics(
  data: NFTData[],
  isHidden: (nft: NFTInfo) => boolean
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
  };

  data.forEach((item) => {
    const { type } = item;
    stats[type] = (stats[type] ?? 0) + 1;

    if (isHidden(item.nft)) {
      stats.hidden += 1;
    } else {
      stats.visible += 1;
    }

    stats.total += 1;
  });

  return stats;
}
