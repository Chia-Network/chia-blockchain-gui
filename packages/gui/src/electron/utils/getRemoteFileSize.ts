import { net } from 'electron';

// todo add a timeout
export default async function getRemoteFileSize(url: string) {
  const response = await new Promise<Electron.IncomingMessage>((resolve, reject) => {
    const request = net.request({
      method: 'HEAD',
      url,
    });

    request.on('response', (res) => {
      resolve(res);
    });

    request.on('error', (err) => {
      reject(err);
    });

    request.end();
  });

  return Number(response.headers['content-length'] || -1);
}
