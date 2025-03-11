import {
  Address,
  BigUIntType,
  BigUIntValue,
  BytesValue,
  CompositeValue,
  List,
  OptionalValue,
  SmartContractQuery,
  Token,
  TokenIdentifierValue,
  TokenTransfer,
  TypedValue,
  U64Value,
  VariadicValue,
} from '@multiversx/sdk-core';
import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { MxApiService } from 'src/common';
import { nominateVal } from 'src/utils';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { gas, mxConfig } from '../../config';
import '../../utils/extensions';
import { ContractLoader } from '../auctions/contractLoader';
import { TransactionNode } from '../common/transaction';
import { BuyRandomNftActionArgs } from './models';
import { BrandInfoViewResultType } from './models/abi/BrandInfoViewAbi';
import { BuyRequest, IssueCampaignRequest } from './models/requests';
import { UpgradeNftRequest } from './models/requests/UpgradeNftRequest ';

@Injectable()
export class NftMinterAbiService {
  private readonly abiPath: string = './src/abis/nft-minter.abi.json';

  constructor(private mxApiService: MxApiService) {}

  public async getCampaignsForScAddress(address: string) {
    const controller = await ContractLoader.getController(this.mxApiService.getService(), this.abiPath);
    let getDataQuery = await controller.runQuery(
      new SmartContractQuery({
        contract: Address.newFromBech32(address),
        function: 'getAllBrandsInfo',
        arguments: [],
      }),
    );

    const [response] = controller.parseQueryResponse(getDataQuery);

    const campaigns: BrandInfoViewResultType[] = response.valueOf();
    return campaigns;
  }

  public async getMaxNftsPerTransaction(address: string) {
    const controller = await ContractLoader.getController(this.mxApiService.getService(), this.abiPath);
    let getDataQuery = await controller.runQuery(
      new SmartContractQuery({
        contract: Address.newFromBech32(address),
        function: 'getMaxNftsPerTransaction',
        arguments: [],
      }),
    );

    const [response] = controller.parseQueryResponse(getDataQuery);

    const maxNftsPerTransaction: BigNumber = response.valueOf();
    return maxNftsPerTransaction?.toNumber();
  }

  async issueToken(request: IssueCampaignRequest): Promise<TransactionNode> {
    const factory = await ContractLoader.getFactory(this.abiPath);

    const transaction = factory.createTransactionForExecute(Address.newFromBech32(request.ownerAddress), {
      contract: Address.newFromBech32(request.minterAddress),
      function: 'issueTokenForBrand',
      gasLimit: gas.issueCampaign,
      arguments: this.getIssueCampaignArgs(request),
      nativeTransferAmount: BigInt(mxConfig.issueNftCost),
    });
    return transaction.toPlainObject();
  }

  async buyRandomNft(ownerAddress: string, request: BuyRequest): Promise<TransactionNode> {
    const factory = await ContractLoader.getFactory(this.abiPath);

    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(request.minterAddress),
      function: 'buyRandomNft',
      gasLimit: parseInt(request.quantity) > 1 ? gas.endAuction + (parseInt(request.quantity) - 1) * gas.endAuction : gas.endAuction,
      arguments: this.getBuyNftArguments(request),
      nativeTransferAmount: BigInt(request.price),
    });

    return transaction.toPlainObject();
  }

  async upgradeNft(ownerAddress: string, request: UpgradeNftRequest): Promise<TransactionNode> {
    const { collection, nonce } = getCollectionAndNonceFromIdentifier(request.identifier);

    const factory = await ContractLoader.getFactory(this.abiPath);
    const token = new Token({ identifier: collection, nonce: BigInt(parseInt(nonce, 16)) });
    const transfer = new TokenTransfer({ token, amount: BigInt(1) });

    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(request.minterAddress),
      function: 'nftUpgrade',
      gasLimit: gas.buySft,
      arguments: [BytesValue.fromUTF8(request.campaignId)],
      tokenTransfers: [transfer],
    });

    return transaction.toPlainObject();
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
