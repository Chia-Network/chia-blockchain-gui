import type BigNumber from 'bignumber.js';

type Connection = {
  bytesRead: number;
  bytesWritten: number;
  creationTime: BigNumber;
  lastMessageTime: BigNumber;
  localPort: number;
  nodeId: string;
  peakHash?: string;
  peakHeight?: number | null;
  peakWeight?: number | null;
  peerHost: string;
  peerPort: number;
  peerServerPort: number;
  type: number;
};

export default Connection;
