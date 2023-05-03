type Plot = {
  plotId: string;
  fileSize: number;
  filename: string;
  plotPublicKey: string;
  poolContractPuzzleHash: null | string;
  poolPublicKey: string;
  size: number;
  timeModified: number;
  compression_level?: number;
};

export default Plot;
