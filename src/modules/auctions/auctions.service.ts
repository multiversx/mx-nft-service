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

@Injectable()
export class AuctionsService {
  constructor(
    private elrondProxyService: ElrondProxyService,
    private auctionServiceDb: AuctionsServiceDb,
  ) {}

  marketPlaceAddress =
    'erd1qqqqqqqqqqqqqpgqg6w343j3zvmtc4dxemcw0xty44rgpn3j62vsccfmkj';

  async createAuction(args: CreateAuctionArgs): Promise<TransactionNode> {
    const contract = this.getSmartContract(args.ownerAddress);
    let createAuctionTx = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new U64Value(new BigNumber(1)),
        new U64Value(new BigNumber(1)),
        new AddressValue(new Address(this.marketPlaceAddress)),
        BytesValue.fromUTF8('auctionToken'),
        new BigUIntValue(new BigNumber(args.minBid)),
        new BigUIntValue(new BigNumber(args.maxBid)),
        new U64Value(new BigNumber(args.deadline)),
        new TokenIdentifierValue(Buffer.from(args.paymentTokenIdentifier)),
      ],
      gasLimit: new GasLimit(100000000),
    });
    return createAuctionTx.toPlainObject();
  }

  async bid(args: TokenActionArgs): Promise<TransactionNode> {
    const contract = this.getSmartContract(args.ownerAddress);

    let bid = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      value: Balance.egld(0),
      args: [
        BytesValue.fromUTF8(args.tokenIdentifier),
        new U64Value(new BigNumber(1)),
        new U64Value(new BigNumber(1)),
        new AddressValue(new Address(this.marketPlaceAddress)),
        BytesValue.fromUTF8('bid'),
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
    console.log(1, auctionData);
    return await this.auctionServiceDb.insertAuction(auctionData);
  }

  async getAuctionQuery(tokenId: string, nonce: string): Promise<TypedValue> {
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
    console.log(1, getDataQuery.buildQuery());

    console.log(2, data);
    let result = getDataQuery.interpretQueryResponse(data);

    console.log(3, result);
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
    console.log(1, getDataQuery.buildQuery());

    console.log(2, data);
    let result = getDataQuery.interpretQueryResponse(data);

    console.log(3, result);
    return result.firstValue.valueOf();
  }

  async getAuctions(address?: string): Promise<Account | any> {
    var account = this.elrondProxyService
      .getService()
      .getAccount(new Address(address));
    return account;
  }

  async getAuction(address: string): Promise<Account | any> {
    var account = this.elrondProxyService
      .getService()
      .getAccount(new Address(address));
    return account;
  }
}
