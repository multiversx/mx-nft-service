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

    const ipfs = await IPFS.create({
      host: fileStorage.host,
      port: fileStorage.port,
      protocol: fileStorage.protocol,
    });
    const payload = await ipfs.add(fileType);
    const { path } = payload;
    const url = `${fileStorage.cdnUrl}${path}`;

    ipfs.stop();
    return new UploadToIpfsResult({
      hash: path,
      url: url,
    });
  }

  async uploadText(text: any): Promise<UploadToIpfsResult> {
    const ipfs = await IPFS.create({
      host: fileStorage.host,
      port: fileStorage.port,
      protocol: fileStorage.protocol,
    });
    const payload = await ipfs.add(text);
    const { path } = payload;
    const url = `${fileStorage.cdnUrl}${path}`;

    ipfs.stop();
    return new UploadToIpfsResult({
      hash: path,
      url: url,
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
