import {
  Address,
  Balance,
  BytesValue,
  ContractFunction,
  decodeString,
  GasLimit,
  SmartContract,
} from '@elrondnetwork/erdjs';
import { Inject, Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common/services/elrond-communication/elrond-api.service';
import { ElrondProxyService } from 'src/common/services/elrond-communication/elrond-proxy.service';
import { AssetLikeEntity } from 'src/db/assets/assets-likes.entity';
import { AssetsLikesRepository } from 'src/db/assets/assets-likes.repository';
import '../../utils/extentions';
import { IpfsService } from '../ipfs/ipfs.service';
import { TransactionNode } from '../transaction';
import { CreateNftArgs, TransferNftArgs, Asset } from './models';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AssetsService {
  constructor(
    private apiService: ElrondApiService,
    private ipfsService: IpfsService,
    private elrondGateway: ElrondProxyService,
    private assetsLikesRepository: AssetsLikesRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) { }

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

  getAssetLikesCount(tokenIdentifier: string,
    tokenNonce: number): Promise<number> {
    try {
      return this.assetsLikesRepository.getAssetLikesCount(tokenIdentifier, tokenNonce);
    } catch (err) {
      this.logger.error('An error occurred while loading asset\'s likes count.', {
        path: 'AssetsService.getAssetLikesCount',
        tokenIdentifier,
        tokenNonce,
      });
    }
  }

  isAssetLiked(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<boolean> {
    try {
      return this.assetsLikesRepository.isAssetLiked(tokenIdentifier, tokenNonce, address);
    } catch (err) {
      this.logger.error('An error occurred while checking if asset is liked.', {
        path: 'AssetsService.isAssetLiked',
        tokenIdentifier,
        tokenNonce,
        address
      });
      return Promise.resolve(false);
    }
  }

  async addLike(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<boolean> {
    try {
      const assetLikeEntity = this.buildAssetLikeEntity(tokenIdentifier, tokenNonce, address);
      await this.assetsLikesRepository.addLike(assetLikeEntity);
      return true;
    }
    catch (err) {
      this.logger.error('An error occurred while adding Asset Like.', {
        path: 'AssetsService.addLike',
        tokenIdentifier,
        tokenNonce,
        address
      });
      return false;
    }
  }

  async removeLike(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<any> {
    try {
      await this.assetsLikesRepository.removeLike(tokenIdentifier, tokenNonce, address);
      return true;
    } catch (err) {
      this.logger.error('An error occurred while removing Asset Like.', {
        path: 'AssetsService.removeLike',
        tokenIdentifier,
        tokenNonce,
        address
      });
      return false;
    }
  }

  private buildAssetLikeEntity(tokenIdentifier: string,
    tokenNonce: number,
    address: string): AssetLikeEntity {
    return new AssetLikeEntity(
      {
        tokenIdentifier,
        tokenNonce,
        address
      });
  }

  private nominateVal(value: string, perc: number = 1): string {
    let response = (parseFloat(value) * perc).toString(16);
    if (response.length % 2 !== 0) {
      response = '0' + response;
    }
    return response;
  }
}
