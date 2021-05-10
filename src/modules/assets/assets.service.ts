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
import { AssetsServiceDb } from 'src/db/assets/assets.service';
import '../../utils/extentions';
import { Account } from '../nfts/dto/account.dto';
import { Asset } from '../nfts/dto/asset.dto';
import CreateNftArgs, { TransferNftArgs } from '../nfts/dto/createNftArgs';
import { Onwer } from '../nfts/dto/onwer.dto';
import { Price } from '../nfts/dto/price.dto';
import { TransactionNode } from '../nfts/dto/transaction';

@Injectable()
export class AssetsService {
  constructor(
    private assetsServiceDb: AssetsServiceDb,
    private apiService: ElrondApiService,
  ) {}
  receiverAddress: string =
    'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u';

  async getAssetsForUser(address: string): Promise<Asset[] | any> {
    const tokens = await this.apiService.getNftsForUser(address);
    let assets: Asset[] = [];
    tokens.forEach((element) => {
      assets.push({
        tokenId: element.identifier,
        tokenNonce: element.nonce,
        lastSalePrice: new Price(),
        creatorAddress: element.creator,
        creator: new Account(),
        ownerAddress: element.owner,
        currentOwner: new Onwer(),
        previousOwners: [],
        attributes: [],
        lastSale: new Date(),
        creationDate: new Date(),
        hash: element.hash,
        name: element.name,
        royalties: element.royalties,
        uris: element.uris || [''],
        tags: [],
      });
    });
    return assets;
  }

  async getAssets(): Promise<Asset[] | any> {
    return this.assetsServiceDb.getAssets();
  }

  async createNft(createAssetArgs: CreateNftArgs): Promise<TransactionNode> {
    const contract = new SmartContract({
      address: new Address(createAssetArgs.ownerAddress),
    });
    const transaction = contract.call({
      func: new ContractFunction('ESDTNFTCreate'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(createAssetArgs.tokenIdentifier),
        BytesValue.fromUTF8('0'),
        BytesValue.fromUTF8(createAssetArgs.name),
        BytesValue.fromUTF8(createAssetArgs.royalties),
        BytesValue.fromUTF8(createAssetArgs.hash),
        BytesValue.fromUTF8(createAssetArgs.attributes),
        BytesValue.fromUTF8(createAssetArgs.uri),
      ],
      gasLimit: new GasLimit(60000000),
    });
    const transactionNode = transaction.toPlainObject();
    return transactionNode;
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
        BytesValue.fromUTF8(transferNftArgs.quantity || '0'),
        BytesValue.fromUTF8(transferNftArgs.destinationAddress),
      ],
      gasLimit: new GasLimit(60000000),
    });
    const transactionNode = transaction.toPlainObject();
    return transactionNode;
  }
}
