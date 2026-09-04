import { app } from 'electron';

// The User-Agent the main process sends when it fetches NFT resources.
//
// Electron's default identifies as a browser (Mozilla/5.0 ... Chrome/... Electron/...).
// The public IPFS gateways sit behind bot management that answers browser
// User-Agents with a JavaScript challenge page a plain HTTP client cannot
// solve — the same request identified honestly as this application is served
// (verified against dweb.link, ipfs.io and nftstorage.link with Electron's
// own network stack). Identifying as what it is also lets gateway operators
// attribute the traffic.
export default function getRequestUserAgent(): string {
  let version = 'unknown';
  try {
    version = app.getVersion();
  } catch {
    // outside a running Electron app (unit tests)
  }

  return `Chia-Blockchain-GUI/${version}`;
}
