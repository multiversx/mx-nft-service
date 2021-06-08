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
import { nominateVal } from '../formatters';
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
    const token = await this.apiService.getNftByTokenIdentifier(
      onwerAddress,
      tokenIdentifier,
      tokenNonce,
    );
    return new Asset({
      tokenIdentifier: token.token,
      tokenNonce: token.nonce,
      name: token.name,
      hash: token.hash,
      creatorAddress: token.creator,
      royalties: token.royalties,
      ownerAddress: token.owner,
      uris: token.uris,
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
        BytesValue.fromUTF8(args.tokenIdentifier),
        BytesValue.fromHex(nominateVal(args.nonce)),
        BytesValue.fromHex(nominateVal(args.quantity)),
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
        BytesValue.fromUTF8(args.tokenIdentifier),
        BytesValue.fromHex(nominateVal(args.nonce)),
        BytesValue.fromHex(nominateVal(args.quantity)),
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
        BytesValue.fromUTF8(args.tokenIdentifier),
        BytesValue.fromHex(nominateVal(args.quantity || 1)),
        BytesValue.fromUTF8(args.name),
        BytesValue.fromHex(nominateVal(parseFloat(args.royalties || '0'))),
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
        BytesValue.fromUTF8(transferNftArgs.tokenIdentifier),
        BytesValue.fromHex(nominateVal(transferNftArgs.tokenNonce || 1)),
        BytesValue.fromHex(nominateVal(transferNftArgs.quantity || 1)),
        new AddressValue(new Address(transferNftArgs.destinationAddress)),
      ],
      gasLimit: new GasLimit(gas.nftTransfer),
    });
    return transaction.toPlainObject();
  }
}
