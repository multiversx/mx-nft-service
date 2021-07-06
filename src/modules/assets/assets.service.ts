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
import { AssetsFilter } from '../filtersTypes';
import { nominateVal } from '../formatters';
import { PinataService } from '../ipfs/pinata.service';
import { TransactionNode } from '../transaction';
import { AssetsLikesService } from './assets-likes.service';
import { AssetsQuery } from './assets-query';
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
    private pinataService: PinataService,
    private assetsLikedService: AssetsLikesService,
  ) {}

  async getAssetsForUser(
    address: string,
    query: string = '',
  ): Promise<[Asset[], number]> {
    const [tokens, count] = await Promise.all([
      this.apiService.getNftsForUser(address, query),
      this.apiService.getTokensForUserCount(address),
    ]);

    const assets = tokens.map((element) => Asset.fromToken(element));
    return [assets, count];
  }

  async getAssets(
    offset: number = 0,
    limit: number = 10,
    filters: AssetsFilter,
  ): Promise<[Asset[], number]> {
    const apiQuery = new AssetsQuery()
      .addCreator(filters?.creatorAddress)
      .addTags(filters?.tags)
      .addCollection(filters?.collection)
      .addPageSize(offset, limit)
      .build();

    if (filters?.likedByAddress) {
      return await this.getlikedByAssets(filters.likedByAddress, limit, offset);
    }
    if (filters?.ownerAddress) {
      return await this.getAssetsByOwnerAddress(filters, apiQuery);
    }

    return await this.getAssetsWithoutOwner(filters, apiQuery);
  }

  async getAssetByTokenAndAddress(
    onwerAddress: string,
    token: string,
    nonce: number,
  ): Promise<Asset> {
    const nft = await this.apiService.getNftByTokenAndAddress(
      onwerAddress,
      token,
      nonce,
    );
    return Asset.fromToken(nft);
  }

  async getAssetByToken(token: string, nonce: number): Promise<Asset> {
    const nft = await this.apiService.getNftByToken(token, nonce);
    return Asset.fromToken(nft);
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
    const file = await args.file;
    const fileData = await this.pinataService.uploadFile(file);
    const asset = await this.pinataService.uploadText({
      description: args.attributes.description,
      fileType: file.mimetype,
      fileUri: fileData.url,
      fileName: file.filename,
    });
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

  private async getAllAssets(query: string = ''): Promise<[Asset[], number]> {
    const [tokens, count] = await Promise.all([
      this.apiService.getAllNfts(query),
      this.apiService.getNftsCount(),
    ]);
    const assets = tokens.map((element) => Asset.fromToken(element));
    return [assets, count];
  }

  private async getAssetsWithoutOwner(
    filters: AssetsFilter,
    query: string = '',
  ): Promise<[Asset[], number]> {
    if (filters?.nonce && filters?.token) {
      return [[await this.getAssetByToken(filters.token, filters.nonce)], 1];
    } else {
      return await this.getAllAssets(query);
    }
  }

  private async getAssetsByOwnerAddress(
    filters: AssetsFilter,
    query: string = '',
  ): Promise<[Asset[], number]> {
    if (filters?.nonce && filters?.token) {
      return [
        [
          await this.getAssetByTokenAndAddress(
            filters.ownerAddress,
            filters.token,
            filters.nonce,
          ),
        ],
        1,
      ];
    } else {
      return await this.getAssetsForUser(filters.ownerAddress, query);
    }
  }

  private async getlikedByAssets(
    likedByAddress: string,
    limit: number,
    offset: number,
  ): Promise<[Asset[], number]> {
    const [assetsLiked, assetsCount] =
      await this.assetsLikedService.getAssetLiked(
        limit,
        offset,
        likedByAddress,
      );
    let assets = [];
    for await (const element of assetsLiked) {
      assets.push(await this.getAssetByToken(element.token, element.nonce));
    }

    return [assets, assetsCount];
  }
}
