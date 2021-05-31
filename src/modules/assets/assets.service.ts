import {
  Address,
  Balance,
  BytesValue,
  ContractFunction,
  decodeString,
  GasLimit,
  SmartContract,
} from '@elrondnetwork/erdjs';
import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common/services/elrond-communication/elrond-api.service';
import { ElrondProxyService } from 'src/common/services/elrond-communication/elrond-proxy.service';
import '../../utils/extentions';
import { FileService } from '../files/file.service';
import { TransactionNode } from '../transaction';
import { CreateNftArgs, TransferNftArgs, Asset } from './models';

@Injectable()
export class AssetsService {
  constructor(
    private apiService: ElrondApiService,
    private fileService: FileService,
    private elrondGateway: ElrondProxyService,
  ) {}

  async getAssetsForUser(address: string): Promise<Asset[] | any> {
    const tokens = await this.apiService.getNftsForUser(address);
    let assets: Asset[] = [];
    tokens.forEach((element) => {
      assets.push(
        new Asset({
          tokenIdentifier: element.token,
          tokenNonce: element.nonce,
          creatorAddress: element.creator,
          ownerAddress: element.owner,
          attributes: element.attributes,
          lastSale: new Date(),
          creationDate: new Date(),
          hash: element.hash,
          name: element.name,
          royalties: element.royalties,
          uris: element.uris || [''],
        }),
      );
    });
    return assets;
  }

  async getAssetByTokenIdentifier(
    onwerAddress: string,
    tokenIdentifier: string,
    tokenNonce: number,
  ): Promise<Asset> {
    const token = await this.elrondGateway.getNftByTokenIdentifier(
      onwerAddress,
      tokenIdentifier,
      tokenNonce,
    );
    return new Asset({
      tokenIdentifier: tokenIdentifier,
      tokenNonce: token.nonce,
      name: token.name,
      hash: decodeString(Buffer.from(token.hash)),
      creatorAddress: token.creator,
      royalties: token.royalties,
      ownerAddress: token.owner,
      uris: token.uris,
    });
  }

  async createNft(args: CreateNftArgs): Promise<TransactionNode> {
    const fileData = await this.fileService.uploadFile(args.file);
    const asset = await this.fileService.uploadFile(
      args.attributes.description,
    );

    const attributes = `tags:${args.attributes.tags};description:${asset.hash}`;

    const contract = new SmartContract({
      address: new Address(args.ownerAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTCreate'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        BytesValue.fromHex(this.nominateVal(args.quantity || '1')),
        BytesValue.fromUTF8(args.name),
        BytesValue.fromHex(this.nominateVal(args.royalties || '0', 100)),
        BytesValue.fromUTF8(fileData.hash),
        BytesValue.fromUTF8(attributes),
        BytesValue.fromUTF8(fileData.url),
      ],
      gasLimit: new GasLimit(60000000),
    });
    return transaction.toPlainObject();
  }

  async transferNft(
    transferNftArgs: TransferNftArgs,
  ): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(transferNftArgs.ownerAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(transferNftArgs.tokenIdentifier),
        BytesValue.fromHex(this.nominateVal(transferNftArgs.tokenNonce || '1')),
        BytesValue.fromHex(this.nominateVal(transferNftArgs.quantity || '1')),
        BytesValue.fromUTF8(transferNftArgs.destinationAddress),
      ],
      gasLimit: new GasLimit(60000000),
    });
    return transaction.toPlainObject();
  }

  private nominateVal(value: string, perc: number = 1): string {
    let response = (parseFloat(value) * perc).toString(16);
    if (response.length % 2 !== 0) {
      response = '0' + response;
    }
    return response;
  }
}
