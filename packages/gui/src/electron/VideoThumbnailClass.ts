import fs from 'fs';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';

/* ffmpeg library should not be packed into app.asar in production! */
let pathToFfmpeg = ffmpegStatic.replace('app.asar', 'app.asar.unpacked');
let pathToFfprobe = ffprobeStatic.path.replace('app.asar', 'app.asar.unpacked');

const DEV = process.env.NODE_ENV !== 'production';
/* ffmpeg binary remains in node_modules (development) */

const numberOfSections = 6;

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
    const metadata: any = await this.probeUri();
    const videoMetadata = metadata.streams.find(
      (stream: any) => stream.codec_type === 'video',
    );
    const { size, duration } = metadata.format;
    const ratio = videoMetadata.width / videoMetadata.height;
    if (duration > 10) {
      for (let count = 1; count <= numberOfSections; count++) {
        await this.createPart(count, duration, ratio);
      }
      await this.concatAndResample(ratio);
    }
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
    if (fs.existsSync(this.filePath + '.mp4')) {
      return { uri: this.uri, filePath: this.filePath, type: 'video' };
    } else if (!fs.existsSync(this.filePath)) {
      await this.createAnimatedThumbnail();
      /* is this kind of stupid to emit the same uri and the same filePath we got?  */
      return { uri: this.uri, filePath: this.filePath, type: 'video' };
    }
  }

  createPart(count: number, duration: number, ratio: number) {
    return new Promise((resolve, reject) => {
      const ss: number = Math.round((count * duration) / (count + 1));
      const execString = `${pathToFfmpeg} -ss ${ss} -to ${ss + 2} -i ${
        this.uri
      } -vcodec copy -an "${this.filePath + '_' + count + '.mp4'}"`;
      exec(execString, (error, stdout, stderr) => {
        resolve(count);
      });
    });
  }

  resampleVideoOnly(ratio: number) {
    return new Promise((resolve, reject) => {
      const scale =
        ratio > 2
          ? '600:' + Math.ceil(600 / ratio / 2) * 2
          : Math.ceil((300 * ratio) / 2) * 2 + ':300';

      const execString = `${pathToFfmpeg} ${this.uri} -filter_complex -vf scale=${scale} "${this.filePath}.mp4"`;
      exec(execString, (error, stdout, stderr) => {
        resolve(true);
      });
    });
  }

  concatAndResample(ratio: number) {
    /* let's find out if any of the files is less than 5% of normal size,
       that means it has no content (is probably black) and we strip it from final thumbnail */
    for (let count = 1; count <= 6; count++) {
      const file = this.filePath + '_' + count + '.mp4';
      const stats = fs.statSync(file);
      const fileSizeInBytes = stats.size;
    }

    return new Promise((resolve, reject) => {
      const inputFiles = Array.from(Array(numberOfSections).keys())
        .map((count) => {
          return '-i "' + this.filePath + '_' + (count + 1) + '.mp4"';
        })
        .join(' ');

      const scale =
        ratio > 2
          ? '600:' + Math.ceil(600 / ratio / 2) * 2
          : Math.ceil((300 * ratio) / 2) * 2 + ':300';

      const execString = `${pathToFfmpeg} ${inputFiles} -filter_complex "concat=n=${numberOfSections}:v=1 [v];[v]scale=${scale}[out]" -map [out] "${this.filePath}.mp4"`;
      exec(execString, (error, stdout, stderr) => {
        resolve(true);
      });
    });
  }
}
