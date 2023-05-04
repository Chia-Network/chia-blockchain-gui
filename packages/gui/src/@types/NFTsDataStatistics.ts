import type FileType from '../constants/FileType';

type NFTsDataStatistics = Record<FileType | 'visible' | 'hidden' | 'total' | 'sensitive', number>;

export default NFTsDataStatistics;
