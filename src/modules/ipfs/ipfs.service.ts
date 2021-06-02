import { Injectable } from '@nestjs/common';
import { fileStorage } from 'src/config';
import { ReadStream } from 'fs';
import { UploadToIpfsResult } from './ipfs.model';
const IPFS = require('ipfs');

@Injectable()
export class IpfsService {
  constructor() {}

  async uploadFile(file: any): Promise<UploadToIpfsResult> {
    const fileData = await file;
    const readStream = await fileData.createReadStream();
    const fileType = await this.readStreamToBuffer(readStream);

    const ipfs = await this.getIpfs();
    const payload = await ipfs.add(fileType);
    const { path } = payload;

    ipfs.stop();
    return this.mapReturnType(path);
  }

  async uploadText(text: any): Promise<UploadToIpfsResult> {
    const ipfs = await this.getIpfs();
    const payload = await ipfs.add(text);
    const { path } = payload;

    ipfs.stop();
    return this.mapReturnType(path);
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

  private async getIpfs() {
    return await IPFS.create({
      host: fileStorage.host,
      port: fileStorage.port,
      protocol: fileStorage.protocol,
    });
  }

  async readStreamToBuffer(readStream: ReadStream): Promise<Buffer> {
    let chunks = [];
    try {
      for await (const chunk of readStream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      throw error;
    }
  }
}
