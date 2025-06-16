import { FileUpload } from 'graphql-upload-ts';
import { CreateNftArgs } from '../CreateNftArgs';

export class CreateNftRequest {
  collection: string;
  quantity: string = '1';
  name: string;
  royalties: string = '0';
  attributes: Attribute;
  file: FileUpload;

  constructor(init?: Partial<CreateNftRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(nftArgs: CreateNftArgs, file: FileUpload) {
    return new CreateNftRequest({
      collection: nftArgs.collection,
      quantity: nftArgs.quantity,
      name: nftArgs.name,
      royalties: nftArgs.royalties,
      attributes: nftArgs.attributes,
      file: file,
    });
  }
}

export class Attribute {
  tags: string[];
  description: string;
  constructor(init?: Partial<Attribute>) {
    Object.assign(this, init);
  }
}

export class CreateNftWithMultipleFilesRequest {
  collection: string;
  quantity: string = '1';
  name: string;
  royalties: string = '0';
  attributes: Attribute;
  files: FileUpload[];

  constructor(init?: Partial<CreateNftWithMultipleFilesRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(nftArgs: CreateNftArgs, files: FileUpload[]) {
    return new CreateNftWithMultipleFilesRequest({
      collection: nftArgs.collection,
      quantity: nftArgs.quantity,
      name: nftArgs.name,
      royalties: nftArgs.royalties,
      attributes: nftArgs.attributes,
      files: files,
    });
  }
}
