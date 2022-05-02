import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { BrandInfo, BuyRandomNftActionArgs } from './models';
import BigNumber from 'bignumber.js';
import {
  Address,
  Balance,
  BigUIntValue,
  BytesValue,
  ContractFunction,
  GasLimit,
  OptionalValue,
  TokenIdentifierValue,
  TypedValue,
  U64Value,
  ChainID,
  NetworkConfig,
  BigUIntType,
  VariadicValue,
  List,
  Interaction,
} from '@elrondnetwork/erdjs';
import { elrondConfig, gas } from '../../config';
import { ElrondProxyService } from 'src/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { TransactionNode } from '../common/transaction';
import { BuyRequest, IssuePresaleCollectionRequest } from './models/requests';

@Injectable()
export class NftMinterAbiService {
  constructor(
    private elrondProxyService: ElrondProxyService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    let defaultNetworkConfig = NetworkConfig.getDefault();
    defaultNetworkConfig.ChainID = new ChainID(elrondConfig.chainID);
  }

  async getPresaleCollections(): Promise<BrandInfo[]> {
    const minters = process.env.MINTERS_ADDRESSES.split(',').map((entry) => {
      return entry.toLowerCase().trim();
    });
    for (const minter of minters) {
      const auction = await this.getPresaleCollectionsForAddress(minter);
      console.log(auction);
    }

    return [];
  }

  private async getPresaleCollectionsForAddress(address: string) {
    const contract = await this.elrondProxyService.getMinterAbiSmartContract(
      address,
    );
    let getDataQuery = <Interaction>contract.methods.getAllBrandsInfo();
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );
    let result = getDataQuery.interpretQueryResponse(data);

    return result?.firstValue?.valueOf();
  }

  async issueToken(
    ownerAddress: string,
    request: IssuePresaleCollectionRequest,
  ): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getMinterAbiSmartContract(
      request.minterAddress,
    );
    let issueTokenForBrand = contract.call({
      func: new ContractFunction('issueTokenForBrand'),
      value: Balance.fromString(elrondConfig.issueNftCost),
      args: this.getIssueCollectionArgs(request),
      gasLimit: new GasLimit(gas.issueToken),
    });
    return issueTokenForBrand.toPlainObject(new Address(ownerAddress));
  }

  // async setLocalRoles(
  //   brandId: string,
  //   ownerAddress: string,
  // ): Promise<TransactionNode> {
  //   const contract = await this.elrondProxyService.getMinterAbiSmartContract();

  //   const setLocalRoles = contract.call({
  //     func: new ContractFunction('setLocalRoles'),
  //     value: Balance.egld(0),
  //     args: [BytesValue.fromUTF8(brandId)],
  //     gasLimit: new GasLimit(gas.withdraw),
  //   });
  //   return setLocalRoles.toPlainObject(new Address(ownerAddress));
  // }

  async buyRandomNft(
    ownerAddress: string,
    request: BuyRequest,
  ): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getMinterAbiSmartContract(
      request.minterAddress,
    );
    let buyRandomNft = contract.call({
      func: new ContractFunction('buyRandomNft'),
      value: Balance.fromString(request.price),
      args: this.getBuyNftArguments(request),
      gasLimit: new GasLimit(gas.endAuction),
    });

    return buyRandomNft.toPlainObject(new Address(ownerAddress));
  }

  private getBuyNftArguments(args: BuyRandomNftActionArgs): TypedValue[] {
    let returnArgs: TypedValue[] = [BytesValue.fromUTF8(args.brandId)];
    if (args.quantity) {
      return [
        ...returnArgs,
        new OptionalValue(
          new BigUIntType(),
          new BigUIntValue(new BigNumber(args.quantity)),
        ),
      ];
    }

    return returnArgs;
  }

  private getIssueCollectionArgs(
    request: IssuePresaleCollectionRequest,
  ): TypedValue[] {
    let returnArgs: TypedValue[] = [
      BytesValue.fromUTF8(request.collectionIpfsHash),
      BytesValue.fromUTF8(request.brandId),
      BytesValue.fromUTF8(request.mediaTypes.split('/')[1]),
      new BigUIntValue(new BigNumber(request.royalties)),
      new U64Value(new BigNumber(request.maxNfts)),
      new U64Value(new BigNumber(request.mintStartTime)),
      new TokenIdentifierValue(Buffer.from(request.mintPriceToken)),
      new BigUIntValue(new BigNumber(request.mintPriceAmount)),
      BytesValue.fromUTF8(request.collectionName),
      BytesValue.fromUTF8(request.collectionTicker),
      VariadicValue.fromItems(
        List.fromItems(request.tags.map((tag) => new U64Value(tag))),
      ),
    ];

    return returnArgs;
  }
}
