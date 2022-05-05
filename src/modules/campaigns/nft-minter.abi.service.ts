import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { BuyRandomNftActionArgs } from './models';
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
  CompositeValue,
} from '@elrondnetwork/erdjs';
import { elrondConfig, gas } from '../../config';
import { ElrondProxyService } from 'src/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { TransactionNode } from '../common/transaction';
import { BuyRequest, IssueCampaignRequest } from './models/requests';
import { nominateVal } from 'src/utils';
import { BrandInfoViewResultType } from './models/abi/BrandInfoViewAbi';

@Injectable()
export class NftMinterAbiService {
  constructor(
    private elrondProxyService: ElrondProxyService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    let defaultNetworkConfig = NetworkConfig.getDefault();
    defaultNetworkConfig.ChainID = new ChainID(elrondConfig.chainID);
  }

  public async getCampaignsForScAddress(address: string) {
    const contract = await this.elrondProxyService.getMinterAbiSmartContract(
      address,
    );
    let getDataQuery = <Interaction>contract.methods.getAllBrandsInfo();
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );
    let result = getDataQuery.interpretQueryResponse(data);
    const campaign: BrandInfoViewResultType[] = result?.firstValue?.valueOf();
    return campaign;
  }

  async issueToken(
    ownerAddress: string,
    request: IssueCampaignRequest,
  ): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getMinterAbiSmartContract(
      request.minterAddress,
    );
    let issueTokenForBrand = contract.call({
      func: new ContractFunction('issueTokenForBrand'),
      value: Balance.fromString(elrondConfig.issueNftCost),
      args: this.getIssueCampaignArgs(request),
      gasLimit: new GasLimit(gas.issueToken),
    });
    return issueTokenForBrand.toPlainObject(new Address(ownerAddress));
  }

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
    let returnArgs: TypedValue[] = [
      BytesValue.fromUTF8(args.campaignId),
      BytesValue.fromUTF8(args.tier),
    ];
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

  private getIssueCampaignArgs(request: IssueCampaignRequest): TypedValue[] {
    let returnArgs: TypedValue[] = [
      BytesValue.fromUTF8(request.collectionIpfsHash),
      BytesValue.fromUTF8(request.campaignId),
      BytesValue.fromUTF8(request.mediaTypes.split('/')[1]),
      BytesValue.fromHex(nominateVal(parseFloat(request.royalties))),
      new U64Value(new BigNumber(request.mintStartTime.toString())),
      new U64Value(new BigNumber(request.mintEndTime.toString())),
      new TokenIdentifierValue(Buffer.from(request.mintPriceToken)),
      BytesValue.fromUTF8(request.collectionName),
      BytesValue.fromUTF8(request.collectionTicker),
      List.fromItems(
        request.tags.map((tag) => new BytesValue(Buffer.from(tag, 'hex'))),
      ),
      VariadicValue.fromItems(
        ...request.tiers.map((tier) =>
          CompositeValue.fromItems(
            BytesValue.fromUTF8(tier.tierName),
            new U64Value(new BigNumber(tier.totalNfts.toString())),
            new BigUIntValue(new BigNumber(tier.mintPriceAmount)),
          ),
        ),
      ),
    ];

    return returnArgs;
  }
}
