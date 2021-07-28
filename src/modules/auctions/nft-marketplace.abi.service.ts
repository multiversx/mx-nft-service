import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { CreateAuctionArgs, AuctionAbi, BidActionArgs } from './models';
import BigNumber from 'bignumber.js';
import {
  Address,
  AddressValue,
  Balance,
  BigUIntValue,
  BooleanType,
  BooleanValue,
  BytesValue,
  ContractFunction,
  GasLimit,
  Interaction,
  OptionalValue,
  SmartContract,
  TokenIdentifierValue,
  TypedValue,
  U64Type,
  U64Value,
  ChainID,
  NetworkConfig,
} from '@elrondnetwork/erdjs';
import { TransactionNode } from '../transaction';
import { elrondConfig, gas } from '../../config';

@Injectable()
export class NftMarketplaceAbiService {
  constructor(private elrondProxyService: ElrondProxyService) {
    let defaultNetworkConfig = NetworkConfig.getDefault();
    defaultNetworkConfig.ChainID = new ChainID(elrondConfig.chainID);
  }

  async createAuction(
    ownerAddress: string,
    args: CreateAuctionArgs,
  ): Promise<TransactionNode> {
    const contract = this.getSmartContract(ownerAddress);

    let createAuctionTx = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: Balance.egld(0),
      args: this.getCreateAuctionArgs(args),
      gasLimit: new GasLimit(gas.startAuction),
    });
    return createAuctionTx.toPlainObject(new Address(ownerAddress));
  }

  async bid(args: BidActionArgs): Promise<TransactionNode> {
    const contract = this.getSmartContract(elrondConfig.nftMarketplaceAddress);
    let bid = contract.call({
      func: new ContractFunction('bid'),
      value: Balance.fromString(args.price),
      args: [
        new U64Value(new BigNumber(args.auctionId)),
        BytesValue.fromUTF8(args.collection),
        new U64Value(new BigNumber(args.nonce)),
      ],
      gasLimit: new GasLimit(gas.bid),
    });
    return bid.toPlainObject();
  }

  async withdraw(auctionId: number): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getSmartContract();

    let withdraw = contract.call({
      func: new ContractFunction('withdraw'),
      value: Balance.egld(0),
      args: [new U64Value(new BigNumber(auctionId))],
      gasLimit: new GasLimit(gas.withdraw),
    });
    return withdraw.toPlainObject();
  }

  async endAuction(auctionId: number): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getSmartContract();
    let endAuction = contract.call({
      func: new ContractFunction('endAuction'),
      value: Balance.egld(0),
      args: [new U64Value(new BigNumber(auctionId))],
      gasLimit: new GasLimit(gas.endAuction),
    });
    return endAuction.toPlainObject();
  }

  async buySftAfterEndAuction(args: BidActionArgs): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getSmartContract();
    let buySftAfterEndAuction = contract.call({
      func: new ContractFunction('buySftAfterEndAuction'),
      value: Balance.fromString(args.price),
      args: [
        new U64Value(new BigNumber(args.auctionId)),
        BytesValue.fromUTF8(args.collection),
        new U64Value(new BigNumber(args.nonce)),
      ],
      gasLimit: new GasLimit(gas.endAuction),
    });
    return buySftAfterEndAuction.toPlainObject();
  }

  async getAuctionQuery(auctionId: number): Promise<AuctionAbi> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getFullAuctionData([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );
    let result = getDataQuery.interpretQueryResponse(data);

    const auction: AuctionAbi = result.firstValue.valueOf();
    return auction;
  }

  async getAuctionStatus(auctionId: string): Promise<AuctionAbi> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getAuctionStatus([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );
    let result = getDataQuery.interpretQueryResponse(data);

    const auction: AuctionAbi = result.firstValue.valueOf();
    return auction;
  }

  async getOriginalOwner(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getOriginalOwner([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getDeadline(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getDeadline([new U64Value(new BigNumber(auctionId))])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getMinMaxBid(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getMinMaxBid([new U64Value(new BigNumber(auctionId))])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getCurrentWinningBid(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getCurrentWinningBid([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getCurrentWinner(auctionId: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getCurrentWinner([
        new U64Value(new BigNumber(auctionId)),
      ])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getCutPercentage(): Promise<any> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getMarketplaceCutPercentage()
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  private getCreateAuctionArgs(args: CreateAuctionArgs): TypedValue[] {
    let returnArgs: TypedValue[] = [
      BytesValue.fromUTF8(args.collection),
      new U64Value(new BigNumber(args.nonce)),
      new U64Value(new BigNumber(args.quantity)),
      new AddressValue(new Address(elrondConfig.nftMarketplaceAddress)),
      BytesValue.fromUTF8('auctionToken'),
      new BigUIntValue(new BigNumber(args.minBid)),
      new BigUIntValue(new BigNumber(args.maxBid || 0)),
      new U64Value(new BigNumber(args.deadline)),
      new TokenIdentifierValue(Buffer.from(args.paymentToken)),
    ];

    if (args.startDate) {
      return [
        ...returnArgs,
        new OptionalValue(
          new U64Type(),
          new U64Value(new BigNumber(args.paymentTokenNonce)),
        ),
        new OptionalValue(
          new BooleanType(),
          new BooleanValue(args.maxOneSftPerPayment),
        ),
        new OptionalValue(
          new U64Type(),
          new U64Value(new BigNumber(args.startDate)),
        ),
      ];
    }

    if (args.maxOneSftPerPayment) {
      return [
        ...returnArgs,
        new OptionalValue(
          new U64Type(),
          new U64Value(new BigNumber(args.paymentTokenNonce)),
        ),
        new OptionalValue(
          new BooleanType(),
          new BooleanValue(args.maxOneSftPerPayment),
        ),
      ];
    }
    return returnArgs;
  }

  private async getFirstQueryResult(
    contract: SmartContract,
    interaction: Interaction,
  ) {
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      interaction.buildQuery(),
    );

    let result = interaction.interpretQueryResponse(data);
    return result.firstValue.valueOf();
  }

  private getSmartContract(address: string) {
    return new SmartContract({
      address: new Address(address),
    });
  }
}
