import { Injectable } from "@nestjs/common"
import * as FileType from 'file-type'
const IPFS = require('ipfs')

@Injectable()
export class FileService {
  private url: string = "https://ipfs.io/ipfs/"

  constructor() { }

  async uploadFile(file: any): Promise<any> {
    const fileData = await file
    const stream = fileData.createReadStream()
    const fileType = await FileType.fromStream(stream)

    // const ipfs = await IPFS.create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

    // const payload = await ipfs.add(fileData)

    // const { cid } = payload
    // return {
    //   hash: cid,
    //   url: `${this.url}${cid}`
    // }
  }

  async streamToBuffer(file: any): Promise<any> {
    let chunks = []

    const readStream = file.createReadStream()
    readStream.on('error', (err: any) => {
      console.log(err)
    })
    readStream.on('finish', () => {
      const buffer = Buffer.concat(chunks)
      console.log(buffer)
      return buffer
    })
    readStream.on('data', (data: any) => {
      console.log(data)
      chunks.push(data)
    })
  }
}