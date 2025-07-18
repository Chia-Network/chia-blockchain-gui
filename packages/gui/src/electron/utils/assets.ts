import { Protocol } from 'electron';
import crypto from 'node:crypto';

const ASSET_PROTOCOL = 'asset';
const assets = new Map<string, { content: string; type: string }>();

export function registerAssetProtocol(protocol: Protocol) {
  protocol.handle(ASSET_PROTOCOL, async (request: Request) => {
    const requestUrl = request.url;
    const url = new URL(requestUrl);
    const id = `${ASSET_PROTOCOL}://${url.hostname}`;

    if (!id || !assets.has(id)) {
      return new Response('Not found', {
        status: 404,
        headers: {
          'content-type': 'text/plain',
        },
      });
    }

    const asset = assets.get(id);
    if (!asset) {
      return new Response('Not found', {
        status: 404,
        headers: {
          'content-type': 'text/plain',
        },
      });
    }

    return new Response(asset.content, {
      status: 200,
      headers: {
        'content-type': asset.type || 'text/plain',
      },
    });
  });
}

export function addAsset(asset: { content: string; type: string }) {
  const url = `${ASSET_PROTOCOL}://${crypto.randomUUID()}`;
  assets.set(url, asset);

  return url;
}

export function removeAsset(url: string | string[]) {
  if (Array.isArray(url)) {
    url.forEach(removeAsset);
  } else {
    assets.delete(url);
  }
}
