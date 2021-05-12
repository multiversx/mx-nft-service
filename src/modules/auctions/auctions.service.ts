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
  TokenIdentifierValue,
  U64Value
} from '@elrondnetwork/erdjs';

@Injectable()
export class AuctionsService {

  constructor(private elrondProxyService: ElrondProxyService) { }

  async createAuction(auctionData: CreateAuctionArgs): Promise<TransactionNode> {
    const contract = await this.elrondProxyService.getSmartCntract()
    let createAuctionTx = await contract.call({
      func: new ContractFunction('ESDTNFTTransfer'),
      args: [
        new TokenIdentifierValue(Buffer.from(auctionData.tokenIdentifier)),
        new U64Value(new BigNumber(auctionData.nonce)),
        new BigUIntValue(new BigNumber(1)),
        BytesValue.fromUTF8(
          new Address(
            'erd1qqqqqqqqqqqqqpgqw8faqylfxhsx3nvpngkh9sf97gh877ysd8ssererdq',
          ).hex(),
        ),
        BytesValue.fromUTF8('auctionToken'),
        new BigUIntValue(new BigNumber(auctionData.minBid)),
        new BigUIntValue(new BigNumber(auctionData.maxBid)),
        new BigUIntValue(new BigNumber(auctionData.deadline)),
        new TokenIdentifierValue(Buffer.from(auctionData.paymentTokenIdentifier))
      ],
      gasLimit: new GasLimit(100_000_000)
    })
    return createAuctionTx.toPlainObject();
  }

  async saveAuction(tokenId: string, nonce: string): Promise<Auction | any> {
    return new Auction()
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
