import { Injectable, Logger } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
const { Upload } = require('@aws-sdk/lib-storage');
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  constructor(private readonly logger: Logger) {}
  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

  async upload(fileData, filename) {
    const readStream = await fileData.createReadStream();

    const bucketS3 = process.env.AWS_S3_BUCKET_NAME;
    return await this.uploadS3(readStream, bucketS3, filename, fileData.mimetype);
  }

  async uploadText(fileData, filename) {
    const readStream = new ReadableString(JSON.stringify(fileData));

    const bucketS3 = process.env.AWS_S3_BUCKET_NAME;
    return await this.uploadS3(readStream, bucketS3, filename, 'application/json');
  }

  private async uploadS3(file, bucket, name, mimetype) {
    const key = `nfts/asset/${String(name)}`;
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: mimetype,
    };

    const s3Client = this.getS3();
    const parallelUploads3 = new Upload({
      client: s3Client,
      params,
    });
    try {
      await parallelUploads3.done();
      return true;
    } catch (e) {
      this.logger.error('An error occurred while trying to upload file to s3', {
        path: 'S3Service.upload',
        exception: e.toString(),
      });
      return false;
    }
  }

  getS3() {
    return new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
}

class ReadableString extends Readable {
  private sent = false;

  constructor(private str: string) {
    super();
  }

  _read() {
    if (!this.sent) {
      this.push(Buffer.from(this.str));
      this.sent = true;
    } else {
      this.push(null);
    }
  }
}
