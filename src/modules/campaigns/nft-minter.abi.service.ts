import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { BuyRandomNftActionArgs } from './models';
import BigNumber from 'bignumber.js';
import {
  Address,
  BigUIntValue,
  BytesValue,
  OptionalValue,
  TokenIdentifierValue,
  TypedValue,
  U64Value,
  BigUIntType,
  VariadicValue,
  List,
  Interaction,
  CompositeValue,
  ResultsParser,
  TokenTransfer,
} from '@multiversx/sdk-core';
import { mxConfig, gas } from '../../config';
import { MxProxyService } from 'src/common';
import { TransactionNode } from '../common/transaction';
import { BuyRequest, IssueCampaignRequest } from './models/requests';
import { nominateVal } from 'src/utils';
import { BrandInfoViewResultType } from './models/abi/BrandInfoViewAbi';
import { UpgradeNftRequest } from './models/requests/UpgradeNftRequest ';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import {ContractLoader} from '../auctions/contractLoader';

@Injectable()
export class NftMinterAbiService {
  private readonly parser: ResultsParser;
  private readonly abiPath: string = './src/abis/nft-minter.abi.json';
  private readonly contract = new ContractLoader(this.abiPath);

  constructor(private mxProxyService: MxProxyService) {
    this.parser = new ResultsParser();
  }

  public async getCampaignsForScAddress(address: string) {
    const contract = await this.contract.getContract(address);
    let getDataQuery = <Interaction>contract.methodsExplicit.getAllBrandsInfo();

    const response = await this.getFirstQueryResult(getDataQuery);
    const campaigns: BrandInfoViewResultType[] = response?.firstValue?.valueOf();
    return campaigns;
  }

  public async getMaxNftsPerTransaction(address: string) {
    const contract = await this.contract.getContract(address);
    let getDataQuery = <Interaction>contract.methodsExplicit.getMaxNftsPerTransaction();

    const response = await this.getFirstQueryResult(getDataQuery);
    const maxNftsPerTransaction: BigNumber = response?.firstValue?.valueOf();
    return maxNftsPerTransaction?.toNumber() ?? 0;
  }

  async issueToken(ownerAddress: string, request: IssueCampaignRequest): Promise<TransactionNode> {
    const contract = await this.contract.getContract(request.minterAddress);
    return contract.methodsExplicit
      .issueTokenForBrand(this.getIssueCampaignArgs(request))
      .withSender(Address.fromString(ownerAddress))
      .withChainID(mxConfig.chainId)
      .withValue(TokenTransfer.egldFromBigInteger(mxConfig.issueNftCost))
      .withGasLimit(gas.issueCamapaign)
      .buildTransaction()
      .toPlainObject();
  }

  async buyRandomNft(ownerAddress: string, request: BuyRequest): Promise<TransactionNode> {
    const contract = await this.contract.getContract(request.minterAddress);
    let buyRandomNft = contract.methodsExplicit
      .buyRandomNft(this.getBuyNftArguments(request))
      .withSender(Address.fromString(ownerAddress))
      .withChainID(mxConfig.chainId)
      .withValue(TokenTransfer.egldFromBigInteger(request.price))
      .withGasLimit(gas.endAuction);

    if (parseInt(request.quantity) > 1) {
      buyRandomNft.withGasLimit(buyRandomNft.getGasLimit().valueOf() + (parseInt(request.quantity) - 1) * gas.endAuction);
    }
    return buyRandomNft.buildTransaction().toPlainObject();
  }

  async upgradeNft(ownerAddress: string, request: UpgradeNftRequest): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(request.identifier);
    const contract = await this.contract.getContract(request.minterAddress);
    return contract.methodsExplicit
      .nftUpgrade([BytesValue.fromUTF8(request.campaignId)])
      .withSingleESDTNFTTransfer(TokenTransfer.metaEsdtFromBigInteger(collection, parseInt(nonce, 16), new BigNumber(1)))
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.buySft)
      .withSender(Address.fromString(ownerAddress))
      .buildTransaction()
      .toPlainObject();
  }

  private async getFirstQueryResult(interaction: Interaction) {
    let queryResponse = await this.mxProxyService.getService().queryContract(interaction.buildQuery());
    let result = this.parser.parseQueryResponse(queryResponse, interaction.getEndpoint());
    return result;
  }

  private getBuyNftArguments(args: BuyRandomNftActionArgs): TypedValue[] {
    let returnArgs: TypedValue[] = [BytesValue.fromUTF8(args.campaignId), BytesValue.fromUTF8(args.tier)];
    if (args.quantity) {
      return [...returnArgs, new OptionalValue(new BigUIntType(), new BigUIntValue(new BigNumber(args.quantity)))];
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
      new TokenIdentifierValue(request.mintPriceToken),
      BytesValue.fromUTF8(request.collectionName),
      BytesValue.fromUTF8(request.collectionTicker),
      new U64Value(new BigNumber(request.whitelistEndTime.toString())),
      List.fromItems(request.tags?.map((tag) => BytesValue.fromUTF8(tag))),
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
