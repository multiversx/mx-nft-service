import { Injectable } from '@nestjs/common';
import { fileStorage } from 'src/config';
import { UploadToIpfsResult } from './ipfs.model';
import { FileContent } from './file.content';
const axios = require('axios');

const FormData = require('form-data');

@Injectable()
export class PinataService {
  constructor() {}

  async uploadFile(readStream: any, filename): Promise<UploadToIpfsResult> {
    const url = `${process.env.PINATA_API_URL}/pinning/pinFileToIPFS`;

    const data = new FormData();
    data.append('file', readStream, filename);

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
      console.log(error);
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
      console.log(error);
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
