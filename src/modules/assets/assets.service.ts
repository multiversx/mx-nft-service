import {
  Address,
  Balance,
  BytesValue,
  ContractFunction,
  GasLimit,
  SmartContract,
} from '@elrondnetwork/erdjs';
import { Injectable } from '@nestjs/common';
import { ElrondApiService } from 'src/common/services/elrond-communication/elrond-api.service';
import { TagEntity } from 'src/db/tags/tag.entity';
import { TagsServiceDb } from 'src/db/tags/tags.service';
import '../../utils/extentions';
import { FileService } from '../files/file.service';
import { TransactionNode } from '../transaction';
import { AddTagsArgs, CreateNftArgs, TransferNftArgs } from './models';
import { Asset } from './models';

@Injectable()
export class AssetsService {
  constructor(
    private apiService: ElrondApiService,
    private tagsServiceDb: TagsServiceDb,
    private fileService: FileService,
  ) {}

  async getAssetsForUser(address: string): Promise<Asset[] | any> {
    const tokens = await this.apiService.getNftsForUser(address);
    let assets: Asset[] = [];
    tokens.forEach((element) => {
      assets.push(
        new Asset({
          tokenId: element.token,
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
  ): Promise<Asset | any> {
    const assets = await this.getAssetsForUser(onwerAddress);
    const asset = assets.find(
      (asset: { tokenId: string }) => asset.tokenId === tokenIdentifier,
    );
    return asset;
  }

  async createNft(createAssetArgs: CreateNftArgs): Promise<TransactionNode> {
    const fileData = await this.fileService.uploadFile(createAssetArgs.file);

    const contract = new SmartContract({
      address: new Address(createAssetArgs.ownerAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTCreate'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(createAssetArgs.tokenIdentifier),
        BytesValue.fromHex(this.nominateVal(createAssetArgs.tokenNonce || '1')),
        BytesValue.fromUTF8(createAssetArgs.name),
        BytesValue.fromHex(
          this.nominateVal(createAssetArgs.royalties || '0', 100),
        ),
        BytesValue.fromUTF8(fileData.hash),
        BytesValue.fromUTF8(createAssetArgs.attributes),
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
        BytesValue.fromHex(this.nominateVal(transferNftArgs.quantity || '1')),
        BytesValue.fromUTF8(transferNftArgs.destinationAddress),
      ],
      gasLimit: new GasLimit(60000000),
    });
    return transaction.toPlainObject();
  }

  async addTags(tagsArgs: AddTagsArgs): Promise<TagEntity[] | any> {
    let tagsToSave: TagEntity[] = [];
    tagsArgs.tags.forEach((tag) =>
      tagsToSave.push(
        new TagEntity({ tokenIdentifier: tagsArgs.tokenIdentifier, tag }),
      ),
    );
    return await this.tagsServiceDb.saveTags(tagsToSave);
  }

  private nominateVal(value: string, perc: number = 1): string {
    let response = (parseFloat(value) * perc).toString(16);
    if (response.length % 2 !== 0) {
      response = '0' + response;
    }
    return response;
  }
}
