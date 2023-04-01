import type FileType from './FileType';

type NFTsDataStatistics = Record<FileType | 'visible' | 'hidden' | 'total', number>;

export default NFTsDataStatistics;
