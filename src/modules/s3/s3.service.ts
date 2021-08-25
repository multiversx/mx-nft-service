import { Inject, Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class S3Service {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;

  async upload(readStream, filename) {
    const bucketS3 = process.env.AWS_S3_BUCKET_NAME;
    return await this.uploadS3(readStream, bucketS3, filename);
  }

  private async uploadS3(file, bucket, name) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
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
