import { Inject, Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Readable } from 'stream';
import { Logger } from 'winston';

@Injectable()
export class S3Service {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

  async upload(fileData, filename) {
    const readStream = await fileData.createReadStream();

    const bucketS3 = process.env.AWS_S3_BUCKET_NAME;
    return await this.uploadS3(readStream, bucketS3, filename);
  }

  async uploadText(fileData, filename) {
    const readStream = new ReadableString(JSON.stringify(fileData));

    const bucketS3 = process.env.AWS_S3_BUCKET_NAME;
    return await this.uploadS3(readStream, bucketS3, filename);
  }

  private async uploadS3(file, bucket, name) {
    const key = `nfts/asset/${String(name)}`;
    const params = {
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: file.mimetype,
    };

    const s3 = this.getS3();
    try {
      await s3.upload(params).promise();
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
    return new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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
