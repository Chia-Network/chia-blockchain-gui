import fs from 'fs';
import { app } from 'electron';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';

/* ffmpeg library should not be packed into app.asar in production! */
let pathToFfmpeg = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
let pathToFfprobe = ffprobeStatic.path.replace('app.asar', 'app.asar.unpacked');

const DEV = process.env.NODE_ENV !== 'production';
/* ffmpeg binary remains in node_modules (development) */

pathToFfmpeg = DEV
  ? pathToFfmpeg.replace(
      'build' + path.sep + 'electron',
      'node_modules' + path.sep + 'ffmpeg-static',
    )
  : pathToFfmpeg;

pathToFfprobe = DEV
  ? pathToFfprobe.replace(
      'build' + path.sep + 'electron',
      'node_modules' + path.sep + 'ffprobe-static',
    )
  : pathToFfprobe;

ffmpeg.setFfmpegPath(pathToFfmpeg);
ffmpeg.setFfprobePath(pathToFfprobe);

interface EmitThumbnail {
  uri: string;
  filePath: string;
}

export default class VideoThumbnail {
  private uri: string;
  private filePath: string;

  constructor(uri: string, cacheFolder: string, appName: string) {
    this.uri = uri;
    this.filePath =
      cacheFolder +
      path.sep +
      appName +
      path.sep +
      Buffer.from(uri).toString('base64');
  }

  async createAnimatedThumbnail() {
    const metadata = await this.probeUri();
    const videoMetadata = metadata.streams.find(
      (stream: any) => stream.codec_type === 'video',
    );
    const { size, duration } = metadata.format;
    console.log('Duration????????', metadata);
    const ratio = videoMetadata.width / videoMetadata.height;
    if (duration > 50) {
      for (let count = 0; count < 6; count++) {
        await this.createPart(count, duration, ratio);
      }
    }
    // uri, duration, size, width, height
    // console.log('ProbeObj........', videoMetadata);
  }

  probeUri() {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(this.uri, (err: any, probeObj: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(probeObj);
        }
      });
    });
  }

  async generateVideoPreviewFile() {
    if (fs.existsSync(this.filePath)) {
      return { uri: this.uri, filePath: this.filePath };
    } else if (!fs.existsSync(this.filePath)) {
      await this.createAnimatedThumbnail();
      /* is this kind of stupid to emit the same uri and the same filePath we got?  */
      return { uri: this.uri, filePath: this.filePath };
    }
  }

  createPart(count: number, duration: number, ratio: number) {
    console.log(
      'Creating...',
      count,
      parseInt((count * duration) / (count + 1)),
      'Ratio:-------_>',
      parseInt(320 / ratio).toString(),
    );
    return new Promise((resolve, reject) => {
      ffmpeg(this.uri)
        .addOptions('-ss', parseInt((count * duration) / (count + 1)))
        .addOptions('-t', 2)
        .addOptions('-vf', 'scale=320:' + parseInt(320 / ratio) + 1)
        // .addOptions('-filter:v scale=320:-1')
        // .addOptions('-c:v libx264')
        .addOptions('-an')
        .output(this.filePath + '_' + count + '.mp4')
        .on('error', function (err: any) {
          console.log('An error occurred: ' + err.message);
          reject(err);
        })
        .on('end', function () {
          resolve(count);
        })
        .run();
    });
  }
}
