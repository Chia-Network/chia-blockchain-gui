import VideoThumbnailClass from './VideoThumbnailClass';
import AudioThumbnailClass from './AudioThumbnailClass';
// const request = require('request');

// (async () => {
//   const VideoThumbnail = new VideoThumbnailClass(
//     'https://u3pm.com/a.mkv',
//     // 'https://u3pm.com/n2.avi',
//     // 'https://u3pm.com/m.mp4',
//     '/Users/rifeljm/Library/Caches/temp',
//     'Test',
//   );
//   const obj = await VideoThumbnail.generateVideoPreviewFile();
// })();

function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

(async () => {
  const url = 'https://u3pm.com/p.mp3';
  const AudioThumbnail = new AudioThumbnailClass(
    url,
    // 'https://u3pm.com/a.mkv',
    // 'https://u3pm.com/n2.avi',
    // 'https://u3pm.com/m.mp4',
    '/Users/rifeljm/Library/Caches/temp',
    'Test',
  );
  const audioData = await AudioThumbnail.createAudioThumbnail();
  console.log('Audiodata?', audioData);

  // const fileSize = await new Promise((resolve, reject) => {
  //   request({ url, method: 'HEAD' }, (err: any, response: any) => {
  //     resolve(response.headers['content-length']);
  //   });
  // });
})();
