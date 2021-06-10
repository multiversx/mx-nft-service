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
import PaginationArgs from '../PaginationArgs.dto';
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

  async getAssetsForUser(
    address: string,
    page: PaginationArgs = new PaginationArgs(),
  ): Promise<Asset[] | any> {
    const tokens = await this.apiService.getNftsForUser(address, page);
    return tokens.map((element) => Asset.fromToken(element));
  }

  async getAllAssets(
    offset: number = 0,
    limit: number = 10,
  ): Promise<[Asset[], number]> {
    const tokens = await this.apiService.getAllNfts(offset, limit);
    const assets = tokens.map((element) => Asset.fromToken(element));
    const count = await this.apiService.getNftsCount();
    return [assets, count];
  }

  async getAssetByToken(
    onwerAddress: string,
    token: string,
    nonce: number,
  ): Promise<Asset> {
    const nft = await this.apiService.getNftByToken(onwerAddress, token, nonce);
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
        BytesValue.fromUTF8(args.token),
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
        BytesValue.fromUTF8(args.token),
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
        BytesValue.fromUTF8(transferNftArgs.token),
        BytesValue.fromHex(nominateVal(transferNftArgs.nonce || 1)),
        BytesValue.fromHex(nominateVal(transferNftArgs.quantity || 1)),
        new AddressValue(new Address(transferNftArgs.destinationAddress)),
      ],
      gasLimit: new GasLimit(gas.nftTransfer),
    });
    return transaction.toPlainObject();
  }
}
