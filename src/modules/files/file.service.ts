import { Injectable } from "@nestjs/common"
import { fileStorage } from "src/config"
import { ReadStream } from "fs"
import { UploadFileResult } from "./file.model"
const IPFS = require('ipfs')

@Injectable()
export class FileService {

  constructor() {
  }

  async uploadFile(file: any): Promise<UploadFileResult> {
    const fileData = await file
    const readStream = await fileData.createReadStream()
    const fileType = await this.readStreamToBuffer(readStream)
    
    const ipfs = await IPFS.create({
      host: fileStorage.host,
      port: fileStorage.port,
      protocol: fileStorage.protocol
    })
    const payload = await ipfs.add(fileType)
    console.log(payload)
    const { path } = payload
    const url = `${fileStorage.cdnUrl}${path}`

    return new UploadFileResult({
      hash: path,
      url: url,
    })
  }

  async readStreamToBuffer(readStream: ReadStream): Promise<Buffer> {
    let chunks = [];
    try {
      for await (const chunk of readStream) {
        chunks.push(chunk)
      }
      return Buffer.concat(chunks);
    } catch (error) {
      throw error
    }
  }
}