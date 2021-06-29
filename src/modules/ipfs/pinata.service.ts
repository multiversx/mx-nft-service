import { Injectable } from '@nestjs/common';
import { fileStorage } from 'src/config';
import { UploadToIpfsResult } from './ipfs.model';
import { FileContent } from './file.content';
const axios = require('axios');

const FormData = require('form-data');

@Injectable()
export class PinataService {
  constructor() {}

  async uploadFile(file: any): Promise<UploadToIpfsResult> {
    const url = `${process.env.PINATA_API_URL}/pinning/pinFileToIPFS`;
    const readStream = await file.createReadStream();

    const data = new FormData();
    data.append('file', readStream, file.filename);

    try {
      const response = await axios.post(url, data, {
        withCredentials: true,
        maxContentLength: 'Infinity',
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
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
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
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
