import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { Auction } from './models';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { Price } from '../assets/models';

@Injectable()
export class AuctionsService {
  constructor(
    private nftAbiService: NftMarketplaceAbiService,
    private auctionServiceDb: AuctionsServiceDb,
  ) {}

  async saveAuction(tokenId: string, nonce: number): Promise<Auction | any> {
    const auctionData = await this.nftAbiService.getAuctionQuery(
      tokenId,
      nonce,
    );
    const savedAuction = await this.auctionServiceDb.insertAuction(
      new AuctionEntity({
        tokenIdentifier: tokenId,
        tokenNonce: nonce,
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
    return savedAuction;
  }

  async getAuctions(address?: string): Promise<Auction[]> {
    var auctions = await this.auctionServiceDb.getAuctions(address);
    let responseAuctions: Auction[] = [];
    auctions.forEach((auction) => {
      responseAuctions.push(this.mapEntityToDto(auction));
    });

    return responseAuctions;
  }

  private mapEntityToDto(auction: AuctionEntity): Auction {
    return new Auction({
      Id: auction.Id,
      ownerAddress: auction.ownerAddress,
      tokenNonce: auction.tokenNonce,
      tokenIdentifier: auction.tokenIdentifier,
      startDate: auction.startDate,
      endDate: auction.endDate,
      minBid: new Price({
        tokenIdentifier: 'EGLD',
        nonce: '1',
        amount: auction.minBid,
      }),
      maxBid: new Price({
        tokenIdentifier: 'EGLD',
        nonce: '1',
        amount: auction.maxBid,
      }),
    });
  }
}
