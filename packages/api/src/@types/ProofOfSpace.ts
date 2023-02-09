type ProofOfSpace =
  | string
  | {
      challenge: string;
      publicPoolKey: string;
      poolContractPuzzleHash: string;
      plotPublicKey: string;
      size: number;
      proof: string;
    };

export default ProofOfSpace;
