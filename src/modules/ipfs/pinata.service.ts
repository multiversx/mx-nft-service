import { Inject, Injectable } from '@nestjs/common';
import { fileStorage } from 'src/config';
import { UploadToIpfsResult } from './ipfs.model';
import { FileContent } from './file.content';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
const axios = require('axios');

const FormData = require('form-data');

@Injectable()
export class PinataService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async uploadFile(file: any): Promise<UploadToIpfsResult> {
    const url = `${process.env.PINATA_API_URL}/pinning/pinFileToIPFS`;
    const readStream = await file.createReadStream();

    const data = new FormData();
    data.append('file', readStream, file.filename);

    try {
      const response = await axios.post(url, data, {
        maxContentLength: 'Infinity',
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });
      return this.mapReturnType(response.data.IpfsHash);
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to add file to pinata.',
        {
          path: 'PinataService.uploadFile',
          exception: error.toString(),
          cacheKey: file,
        },
      );
      return;
    }
  }

  async uploadText(fileMetadata: FileContent): Promise<UploadToIpfsResult> {
    const url = `${process.env.PINATA_API_URL}/pinning/pinJSONToIPFS`;
    try {
      const response = await axios.post(url, fileMetadata, {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });

      return this.mapReturnType(response.data.IpfsHash);
    } catch (error) {
      this.logger.error(
        'An error occurred while trying to add file to pinata.',
        {
          path: 'PinataService.uploadText',
          exception: error.toString(),
          cacheKey: fileMetadata,
        },
      );
      return;
    }
  }

  private getUrl(path: any) {
    return `${fileStorage.cdnUrl}${path}`;
  }

  private mapReturnType(
    path: any,
  ): UploadToIpfsResult | PromiseLike<UploadToIpfsResult> {
    return new UploadToIpfsResult({
      hash: path,
      url: this.getUrl(path),
    });
  }
}
