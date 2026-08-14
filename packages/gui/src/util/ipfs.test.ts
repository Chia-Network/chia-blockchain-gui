import ipfsToGatewayUrl, { IPFS_GATEWAY_BASE, getIpfsPath, isIpfsUrl } from './ipfs';

// CID taken from a real mainnet NFT whose on-chain data URI is ipfs://
const CID_V1 = 'bafybeiceg2gltyhlkukwetn26k7t2zdvthg4u4c6uj23rpni2adzgvo5si';
const CID_V0 = 'QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB';

describe('isIpfsUrl', () => {
  it('matches the ipfs scheme case-insensitively', () => {
    expect(isIpfsUrl(`ipfs://${CID_V1}/020.png`)).toBe(true);
    expect(isIpfsUrl(`IPFS://${CID_V1}`)).toBe(true);
  });

  it('does not match other schemes', () => {
    expect(isIpfsUrl(`https://ipfs.io/ipfs/${CID_V1}`)).toBe(false);
    expect(isIpfsUrl('')).toBe(false);
  });
});

describe('getIpfsPath', () => {
  it('returns the CID and path', () => {
    expect(getIpfsPath(`ipfs://${CID_V1}/020.png`)).toBe(`${CID_V1}/020.png`);
    expect(getIpfsPath(`ipfs://${CID_V1}`)).toBe(CID_V1);
  });

  it('strips the redundant ipfs/ prefix some minting tools produce', () => {
    expect(getIpfsPath(`ipfs://ipfs/${CID_V1}/020.png`)).toBe(`${CID_V1}/020.png`);
  });

  it('preserves the case of CIDv0 base58 hashes', () => {
    expect(getIpfsPath(`ipfs://${CID_V0}/image.png`)).toBe(`${CID_V0}/image.png`);
  });

  it('returns undefined for non-ipfs URLs and a bare scheme', () => {
    expect(getIpfsPath(`https://example.com/${CID_V1}`)).toBeUndefined();
    expect(getIpfsPath('ipfs://')).toBeUndefined();
  });
});

describe('ipfsToGatewayUrl', () => {
  it('translates ipfs:// URIs to the HTTPS gateway', () => {
    expect(ipfsToGatewayUrl(`ipfs://${CID_V1}/020.png`)).toBe(`${IPFS_GATEWAY_BASE}${CID_V1}/020.png`);
    expect(ipfsToGatewayUrl(`ipfs://ipfs/${CID_V1}`)).toBe(`${IPFS_GATEWAY_BASE}${CID_V1}`);
  });

  it('returns non-ipfs URLs unchanged', () => {
    const url = 'https://example.com/image.png?size=large';
    expect(ipfsToGatewayUrl(url)).toBe(url);
  });

  it('returns an unusable bare scheme unchanged so validation rejects it', () => {
    expect(ipfsToGatewayUrl('ipfs://')).toBe('ipfs://');
  });
});
