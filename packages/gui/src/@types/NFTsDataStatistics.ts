import type FileType from '../constants/FileType';

type NFTsDataStatistics = Record<
  FileType | 'visible' | 'hidden' | 'total' | 'sensitive' | 'previewAvailable' | 'previewUnavailable',
  number
>;

export default NFTsDataStatistics;
