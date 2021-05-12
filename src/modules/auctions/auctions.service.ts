import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { ElrondProxyService } from '../../common/services/elrond-communication/elrond-proxy.service';
import { TransactionNode } from '../nfts/dto/transaction';
import { Auction, CreateAuctionArgs } from '../nfts/dto/auction.dto';
import BigNumber from 'bignumber.js';
import {
  Address,
  BigUIntValue,
  BytesValue,
  ContractFunction,
  GasLimit,
  Interaction,
  TokenIdentifierValue,
  TypedValue,
  U64Value
} from '@elrondnetwork/erdjs';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service';

@Injectable()
export class AuctionsService {

  constructor(
    private elrondProxyService: ElrondProxyService,
    private auctionServiceDb: AuctionsServiceDb
  ) { }

  async createAuction(auctionData: CreateAuctionArgs): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getSmartContract()
    let createAuctionTx = contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      args: [
        new TokenIdentifierValue(Buffer.from(auctionData.tokenIdentifier)),
        new U64Value(new BigNumber(auctionData.nonce)),
        new BigUIntValue(new BigNumber(1)),
        BytesValue.fromUTF8(contract.getAddress().hex()),
        BytesValue.fromUTF8('auctionToken'),
        new BigUIntValue(new BigNumber(auctionData.minBid)),
        new BigUIntValue(new BigNumber(auctionData.maxBid)),
        new BigUIntValue(new BigNumber(auctionData.deadline)),
        new TokenIdentifierValue(Buffer.from(auctionData.paymentTokenIdentifier)),
      ],
      gasLimit: new GasLimit(100000000)
    })
    return createAuctionTx.toPlainObject();
  }

  async saveAuction(tokenId: string, nonce: string): Promise<Auction | any> {
    const auctionData = this.getAuctionQuery(tokenId, nonce)
    return await this.auctionServiceDb.insertAuction(auctionData)
  }

  async getAuctionQuery(tokenId: string, nonce: string): Promise<TypedValue> {
    const contract = await this.elrondProxyService.getSmartContract()
    let getDataQuery = <Interaction>(
      contract.methods.getFullAuctionData(
        [
          new TokenIdentifierValue(Buffer.from(tokenId)),
          new U64Value(new BigNumber(nonce))
        ]
      )
    )
    let data = await contract.runQuery(
      this.elrondProxyService.getService(),
      getDataQuery.buildQuery()
    )
    let result = getDataQuery.interpretQueryResponse(data)
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
