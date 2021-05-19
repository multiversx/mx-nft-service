import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { TransactionNode } from '../nfts/dto/transaction';
import { Auction, CreateAuctionArgs } from '../nfts/dto/auction.dto';
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
  SmartContract,
  TokenIdentifierValue,
  TypedValue,
  U64Value,
} from '@elrondnetwork/erdjs';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service';
import { TokenActionArgs } from './tokenActionArgs';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { AuctionAbi } from './AuctionAbi';
import { elrondConfig } from 'src/config';

@Injectable()
export class AuctionsService {
  constructor(
    private elrondProxyService: ElrondProxyService,
    private auctionServiceDb: AuctionsServiceDb,
  ) {}

  async createAuction(args: CreateAuctionArgs): Promise<TransactionNode> {
    const contract = this.getSmartContract(args.ownerAddress);
    let createAuctionTx = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new U64Value(new BigNumber(1)),
        new U64Value(new BigNumber(1)),
        new AddressValue(new Address(elrondConfig.nftMarketplaceAddress)),
        BytesValue.fromUTF8('auctionToken'),
        new BigUIntValue(new BigNumber(args.minBid)),
        new BigUIntValue(new BigNumber(args.maxBid)),
        new U64Value(new BigNumber(args.deadline)),
        new TokenIdentifierValue(Buffer.from(args.paymentTokenIdentifier)),
      ],
      gasLimit: new GasLimit(1499999999),
    });
    return createAuctionTx.toPlainObject();
  }

  async bid(args: TokenActionArgs): Promise<TransactionNode> {
    const contract = this.getSmartContract(elrondConfig.nftMarketplaceAddress);
    let bid = contract.call({
      func: new ContractFunction('bid'),
      value: Balance.egld(0.000000000000000002),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new U64Value(new BigNumber(args.tokenNonce)),
      ],
      gasLimit: new GasLimit(100000000),
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
      gasLimit: new GasLimit(100000000),
    });
    return withdraw.toPlainObject();
  }

  private getSmartContract(address: string) {
    return new SmartContract({
      address: new Address(address),
    });
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
      gasLimit: new GasLimit(100000000),
    });
    return endAuction.toPlainObject();
  }

  async saveAuction(tokenId: string, nonce: string): Promise<Auction | any> {
    const auctionData = await this.getAuctionQuery(tokenId, nonce);
    const savedAuction = await this.auctionServiceDb.insertAuction(
      new AuctionEntity({
        tokenIdentifier: tokenId,
        paymentTokenIdentifier: auctionData.payment_token.token_type
          .valueOf()
          .toString(),
        paymentNonce: auctionData.payment_token.nonce.valueOf().toString(),
        ownerAddress: auctionData.original_owner.valueOf().toString(),
        minBid: auctionData.min_bid.valueOf().toString(),
        maxBid: auctionData.max_bid.valueOf().toString(),
        creationDate: new Date(new Date().toUTCString()),
        startDate: new Date(new Date().toUTCString()),
        endDate: new Date(
          parseInt(auctionData.deadline.valueOf().toString()) * 1000,
        ),
      }),
    );
    console.log('savedAuction', savedAuction);
    return savedAuction;
  }

  async getAuctionQuery(tokenId: string, nonce: string): Promise<AuctionAbi> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getFullAuctionData([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(1)),
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
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );

    let result = getDataQuery.interpretQueryResponse(data);
    return result.firstValue.valueOf();
  }

  async getDeadline(tokenId: string, nonce: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getDeadline([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(1)),
      ])
    );
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );

    let result = getDataQuery.interpretQueryResponse(data);

    return result.firstValue.valueOf();
  }

  async getMin(tokenId: string, nonce: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getMinMaxBid([
        new TokenIdentifierValue(Buffer.from(tokenId)),
        new U64Value(new BigNumber(1)),
      ])
    );
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );

    let result = getDataQuery.interpretQueryResponse(data);
    return result.firstValue.valueOf();
  }

  async getCutPercentage(): Promise<any> {
    const contract = await this.elrondProxyService.getSmartContract();
    let getDataQuery = <Interaction>(
      contract.methods.getMarketplaceCutPercentage()
    );
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery(),
    );
    let result = getDataQuery.interpretQueryResponse(data);

    return result.firstValue.valueOf();
  }

  async getAuctions(address?: string): Promise<Auction | any> {
    var account = this.auctionServiceDb.getAuctions(address);
    return account;
  }

  async getAuction(address: string): Promise<Account | any> {
    var account = this.auctionServiceDb.getAuctions(address);
    return account;
  }
}
