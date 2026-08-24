// Whether an NFT's gallery tile can show its media. UNAVAILABLE covers every
// placeholder a tile renders instead of content: no file to verify against, a
// file that failed to download, and a file that does not match its hash.
enum NFTPreviewStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
}

export default NFTPreviewStatus;
