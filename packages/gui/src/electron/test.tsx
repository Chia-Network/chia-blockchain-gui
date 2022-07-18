import VideoThumbnailClass from './VideoThumbnailClass';

console.log('=========>', process.env.NODE_ENV);

(async () => {
  const VideoThumbnail = new VideoThumbnailClass(
    'https://u3pm.com/m.mp4',
    '/Users/rifeljm/Library/Caches/temp',
    'Test',
  );
  const obj = await VideoThumbnail.generateVideoPreviewFile();
})();
