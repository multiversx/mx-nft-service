import { Injectable, Logger } from '@nestjs/common';
import { PinataUploadError } from 'src/common/models/errors/pinata-upload.error';
import { fileStorage } from 'src/config';
import { Readable } from 'stream';
import { FileContent } from './file.content';
import { UploadToIpfsResult } from './ipfs.model';
const axios = require('axios');

const FormData = require('form-data');

@Injectable()
export class PinataService {
  constructor(private readonly logger: Logger) {}

  async uploadFile(file: any): Promise<UploadToIpfsResult> {
    const url = `${process.env.PINATA_API_URL}/v3/files`;
    const { createReadStream, filename /*, fieldName, mimetype, encoding */ } = await file;
    const data = new FormData();
    data.append('file', createReadStream(), filename);
    data.append('network', 'public');
    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });

      return this.mapReturnType(response.data.data.cid);
    } catch (error) {
      this.logger.error('An error occurred while trying to add file to pinata.', {
        path: 'PinataService.uploadFile',
        exception: error,
        cacheKey: file,
      });
      throw new PinataUploadError('An error has occoured while uploading in IPFS, please try again.');
    }
  }

  async uploadText(fileMetadata: FileContent): Promise<UploadToIpfsResult> {
    const url = `${process.env.PINATA_API_URL}/v3/files`;
    const jsonString = JSON.stringify(fileMetadata, null, 2);

    // 3. Create a readable stream from the string
    const jsonStream = Readable.from([jsonString]);

    // 4. Create FormData and append the "file" stream
    const formData = new FormData();
    formData.append('file', jsonStream, {
      filename: 'metadata.json',
      contentType: 'application/json',
    });

    formData.append('network', 'public');
    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });

      return this.mapReturnType(response.data.data.cid);
    } catch (error) {
      this.logger.error('An error occurred while trying to add file to pinata.', {
        path: 'PinataService.uploadText',
        exception: error,
        cacheKey: fileMetadata,
      });
      throw new PinataUploadError('An error has occoured while uploading in IPFS, please try again.');
    }
  }

  private getUrl(path: any) {
    return `${fileStorage.cdnUrl}${path}`;
  }

  private mapReturnType(path: any): UploadToIpfsResult | PromiseLike<UploadToIpfsResult> {
    return new UploadToIpfsResult({
      hash: path,
      url: this.getUrl(path),
    });
  }
}
