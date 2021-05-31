import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import {
  CreateAuctionArgs,
  TokenActionArgs,
  AuctionAbi,
  BidActionArgs,
} from './models';
import BigNumber from 'bignumber.js';
import {
  Address,
  AddressValue,
  Balance,
  BigUIntValue,
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
} from '@elrondnetwork/erdjs';
import { elrondConfig, gas } from 'src/config';
import { TransactionNode } from '../transaction';

@Injectable()
export class NftMarketplaceAbiService {
  constructor(private elrondProxyService: ElrondProxyService) {}

  async createAuction(args: CreateAuctionArgs): Promise<TransactionNode> {
    const contract = this.getSmartContract(args.ownerAddress);
    let createAuctionTx = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new U64Value(new BigNumber(args.nonce)),
        new U64Value(new BigNumber(args.nonce)),
        new AddressValue(new Address(elrondConfig.nftMarketplaceAddress)),
        BytesValue.fromUTF8('auctionToken'),
        new BigUIntValue(new BigNumber(args.minBid)),
        new BigUIntValue(new BigNumber(args.maxBid)),
        new U64Value(new BigNumber(args.deadline)),
        new TokenIdentifierValue(Buffer.from(args.paymentTokenIdentifier)),
        new OptionalValue(
          new U64Type(),
          new U64Value(new BigNumber(args.paymentTokenNonce)),
        ),
        new OptionalValue(
          new U64Type(),
          new U64Value(new BigNumber(args.startDate)),
        ),
      ],
      gasLimit: new GasLimit(gas.startAuction),
    });
    return createAuctionTx.toPlainObject();
  }

  async bid(args: BidActionArgs): Promise<TransactionNode> {
    const contract = this.getSmartContract(elrondConfig.nftMarketplaceAddress);
    let bid = contract.call({
      func: new ContractFunction('bid'),
      value: Balance.fromString(args.price),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new U64Value(new BigNumber(args.tokenNonce)),
      ],
      gasLimit: new GasLimit(gas.bid),
    });
    return bid.toPlainObject();
  }

  async withdraw(args: TokenActionArgs): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getSmartContract();

    let withdraw = contract.call({
      func: new ContractFunction('withdraw'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new U64Value(new BigNumber(args.tokenNonce)),
      ],
      gasLimit: new GasLimit(gas.withdraw),
    });
    return withdraw.toPlainObject();
  }

  async endAuction(args: TokenActionArgs): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getSmartContract();
    let endAuction = contract.call({
      func: new ContractFunction('endAuction'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new U64Value(new BigNumber(args.tokenNonce)),
      ],
      gasLimit: new GasLimit(gas.endAuction),
    });
    return endAuction.toPlainObject();
  }

  async getAuctionQuery(tokenId: string, nonce: number): Promise<AuctionAbi> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getFullAuctionData([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(nonce)),
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

  async getOriginalOwner(tokenId: string, nonce: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getOriginalOwner([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(1)),
      ])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getDeadline(tokenId: string, nonce: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getDeadline([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(1)),
      ])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getMinMaxBid(tokenId: string, nonce: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getMinMaxBid([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(nonce)),
      ])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getCurrentWinningBid(
    tokenId: string,
    nonce: string,
  ): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getCurrentWinningBid([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(nonce)),
      ])
    );
    return await this.getFirstQueryResult(contract, getDataQuery);
  }

  async getCurrentWinner(tokenId: string, nonce: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getCurrentWinner([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(nonce)),
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
