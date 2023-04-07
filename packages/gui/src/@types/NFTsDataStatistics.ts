import type FileType from './FileType';

type NFTsDataStatistics = Record<FileType | 'visible' | 'hidden' | 'total' | 'sensitive', number>;

export default NFTsDataStatistics;
