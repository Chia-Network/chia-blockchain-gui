import selectNFTPreviewState, { type NFTPreviewState } from './selectNFTPreviewState';

const fetchFailure: NFTPreviewState = {
  isVerified: false,
  uri: 'https://example.com/unavailable.mp4',
  error: new Error('Request failed'),
  failedFetch: true,
};

const hashMismatch: NFTPreviewState = {
  isVerified: false,
  uri: 'https://example.com/tampered.png',
  error: new Error('Invalid hash checksum'),
  failedFetch: false,
};

describe('selectNFTPreviewState', () => {
  it('does not expose optimistic preview URIs without expected hashes', () => {
    expect(
      selectNFTPreviewState({
        isVerifying: true,
        previewVideoCandidate: {
          uris: ['https://example.com/unverifiable.mp4'],
        },
        previewImageCandidate: {
          uris: ['https://example.com/unverifiable.png'],
        },
        dataCandidate: {
          uris: ['https://example.com/unverifiable-data.png'],
        },
      }),
    ).toBeUndefined();
  });

  it('moves to the next verifiable candidate while an earlier source has failed', () => {
    expect(
      selectNFTPreviewState({
        isVerifying: true,
        previewVideo: fetchFailure,
        previewImageCandidate: {
          uris: ['https://example.com/preview.png'],
          hash: 'preview-hash',
        },
        dataCandidate: {
          uris: ['https://example.com/data.png'],
          hash: 'data-hash',
        },
      }),
    ).toEqual({
      isVerified: false,
      isVerifying: true,
      uri: 'https://example.com/preview.png',
    });
  });

  it('reports a checksum mismatch ahead of fetch failures across source types', () => {
    expect(
      selectNFTPreviewState({
        isVerifying: false,
        previewVideo: fetchFailure,
        data: hashMismatch,
      }),
    ).toBe(hashMismatch);
  });

  it('keeps verified preview priority at video, image, then data', () => {
    const verifiedVideo: NFTPreviewState = {
      isVerified: true,
      uri: 'https://example.com/verified.mp4',
    };
    const verifiedImage: NFTPreviewState = {
      isVerified: true,
      uri: 'https://example.com/verified.png',
    };

    expect(
      selectNFTPreviewState({
        isVerifying: false,
        previewVideo: verifiedVideo,
        previewImage: verifiedImage,
      }),
    ).toBe(verifiedVideo);
  });
});
