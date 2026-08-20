export type NFTPreviewState = {
  isVerified: boolean;
  uri: string;
  error?: Error;
  // The file could not be downloaded — distinct from a real hash mismatch.
  failedFetch?: boolean;
  // Optimistic state: checksums are still being computed for this URI.
  isVerifying?: boolean;
};

type PreviewCandidate = {
  uris?: string[];
  hash?: string;
};

export type SelectNFTPreviewStateOptions = {
  isVerifying: boolean;
  data?: NFTPreviewState;
  previewVideo?: NFTPreviewState;
  previewImage?: NFTPreviewState;
  dataCandidate?: PreviewCandidate;
  previewVideoCandidate?: PreviewCandidate;
  previewImageCandidate?: PreviewCandidate;
};

function asCandidate(candidate: PreviewCandidate | undefined): NFTPreviewState | undefined {
  const uri = candidate?.uris?.[0];

  // Never render an optimistic URI unless it has an expected checksum. Without
  // one, the candidate can never transition into a verified preview.
  if (!uri || !candidate?.hash) {
    return undefined;
  }

  return {
    isVerified: false,
    isVerifying: true,
    uri,
  };
}

export default function selectNFTPreviewState({
  isVerifying,
  data,
  previewVideo,
  previewImage,
  dataCandidate,
  previewVideoCandidate,
  previewImageCandidate,
}: SelectNFTPreviewStateOptions): NFTPreviewState | undefined {
  const states = [previewVideo, previewImage, data];

  // Walk sources strictly in priority order (preview video, preview image,
  // data). A source that is still verifying holds its slot with an optimistic
  // state, so a lower-priority source that happens to verify first (typically
  // the cached data file) cannot preempt it — that would render the full data
  // file and then visibly swap to the intended thumbnail moments later.
  const ordered: [NFTPreviewState | undefined, PreviewCandidate | undefined][] = [
    [previewVideo, previewVideoCandidate],
    [previewImage, previewImageCandidate],
    [data, dataCandidate],
  ];

  for (const [state, candidate] of ordered) {
    if (state?.isVerified) {
      return state;
    }

    if (!state && isVerifying) {
      const optimisticState = asCandidate(candidate);
      if (optimisticState) {
        return optimisticState;
      }
    }
  }

  // A checksum mismatch is stronger evidence than a network failure. Apply
  // that priority across video, image, and data instead of only within each
  // source's URI list.
  const mismatch = states.find((state) => state && !state.isVerified && state.failedFetch === false);
  return mismatch ?? states.find((state) => state !== undefined);
}
