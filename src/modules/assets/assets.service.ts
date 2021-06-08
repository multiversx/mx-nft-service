import {
  Address,
  AddressValue,
  Balance,
  BytesValue,
  ContractFunction,
  GasLimit,
  SmartContract,
} from '@elrondnetwork/erdjs';
import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common/services/elrond-communication/elrond-api.service';
import { gas } from 'src/config';
import '../../utils/extentions';
import { IpfsService } from '../ipfs/ipfs.service';
import { TransactionNode } from '../transaction';
import {
  CreateNftArgs,
  TransferNftArgs,
  Asset,
  HandleQuantityArgs,
} from './models';

@Injectable()
export class AssetsService {
  constructor(
    private apiService: ElrondApiService,
    private ipfsService: IpfsService,
  ) {}

  async getAssetsForUser(address: string): Promise<Asset[] | any> {
    const tokens = await this.apiService.getNftsForUser(address);
    return tokens.map((element) => Asset.fromToken(element));
  }

  async getAllAssets(): Promise<Asset[] | any> {
    const tokens = await this.apiService.getAllNfts();
    return tokens.map((element) => Asset.fromToken(element));
  }

  async getAssetByToken(
    onwerAddress: string,
    token: string,
    nonce: number,
  ): Promise<Asset> {
    const nft = await this.apiService.getNftByTokenIdentifier(
      onwerAddress,
      token,
      nonce,
    );
    return new Asset({
      token: nft.token,
      nonce: nft.nonce,
      name: nft.name,
      hash: nft.hash,
      creatorAddress: nft.creator,
      royalties: nft.royalties,
      ownerAddress: nft.owner,
      uris: nft.uris,
    });
  }

  async addQuantity(args: HandleQuantityArgs): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(args.addOrBurnRoleAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTAddQuantity'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.token),
        BytesValue.fromHex(this.nominateVal(args.nonce.toString())),
        BytesValue.fromHex(this.nominateVal(args.quantity.toString())),
      ],
      gasLimit: new GasLimit(gas.addQuantity),
    });
    return transaction.toPlainObject();
  }

  async burnQuantity(args: HandleQuantityArgs): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(args.addOrBurnRoleAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTBurn'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.token),
        BytesValue.fromHex(this.nominateVal(args.nonce.toString())),
        BytesValue.fromHex(this.nominateVal(args.quantity.toString())),
      ],
      gasLimit: new GasLimit(gas.burnQuantity),
    });
    return transaction.toPlainObject();
  }

  async createNft(args: CreateNftArgs): Promise<TransactionNode> {
    const fileData = await this.ipfsService.uploadFile(args.file);
    const asset = await this.ipfsService.uploadText(
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
        BytesValue.fromUTF8(args.token),
        BytesValue.fromHex(this.nominateVal(args.quantity || '1')),
        BytesValue.fromUTF8(args.name),
        BytesValue.fromHex(this.nominateVal(args.royalties || '0', 100)),
        BytesValue.fromUTF8(fileData.hash),
        BytesValue.fromUTF8(attributes),
        BytesValue.fromUTF8(fileData.url),
      ],
      gasLimit: new GasLimit(gas.nftCreate),
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
        BytesValue.fromUTF8(transferNftArgs.token),
        BytesValue.fromHex(this.nominateVal(transferNftArgs.nonce || '1')),
        BytesValue.fromHex(this.nominateVal(transferNftArgs.quantity || '1')),
        new AddressValue(new Address(transferNftArgs.destinationAddress)),
      ],
      gasLimit: new GasLimit(gas.nftTransfer),
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
