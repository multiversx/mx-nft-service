import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { Auction, AuctionAbi, UpdateAuctionArgs } from './models';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { Price } from '../assets/models';
import { AuctionStatusEnum } from './models/AuctionStatus.enum';
import { AuctionTypeEnum } from './models/AuctionType.enum';
import { nominateVal } from '../formatters';
import { QueryRequest } from '../QueryRequest';

@Injectable()
export class AuctionsService {
  constructor(
    private nftAbiService: NftMarketplaceAbiService,
    private auctionServiceDb: AuctionsServiceDb,
  ) {}

  async saveAuction(auctionId: number): Promise<Auction | any> {
    const auctionData = await this.nftAbiService.getAuctionQuery(auctionId);
    const savedAuction = await this.auctionServiceDb.insertAuction(
      this.mapDtoToEntity(auctionId, auctionData),
    );
    return savedAuction;
  }

  async getAuctions(queryRequest: QueryRequest): Promise<[Auction[], number]> {
    const [auctions, count] = await this.auctionServiceDb.getAuctions(
      queryRequest,
    );
    let responseAuctions: Auction[] = [];
    auctions.forEach((auction) => {
      responseAuctions.push(this.mapEntityToDto(auction));
    });

    return [responseAuctions, count];
  }

  async updateAuction(args: UpdateAuctionArgs): Promise<Auction | any> {
    return await this.auctionServiceDb.updateAuction(args.id, args.status);
  }

  private mapDtoToEntity(auctionId: number, auctionData: AuctionAbi): any {
    return new AuctionEntity({
      id: auctionId,
      token: auctionData.auctioned_token.token_type.valueOf().toString(),
      nonce: parseInt(auctionData.auctioned_token.nonce.valueOf().toString()),
      status:
        AuctionStatusEnum[auctionData.auction_status.valueOf().toString()],
      type: AuctionTypeEnum[auctionData.auction_type.valueOf().toString()],
      paymentToken: auctionData.payment_token.token_type.valueOf().toString(),
      paymentNonce: parseInt(
        auctionData.payment_token.nonce.valueOf().toString(),
      ),
      ownerAddress: auctionData.original_owner.valueOf().toString(),
      minBid: auctionData.min_bid.valueOf().toString(),
      maxBid: auctionData.max_bid.valueOf().toString(),
      creationDate: new Date(new Date().toUTCString()),
      startDate: auctionData.start_time.valueOf().toString(),
      endDate: auctionData.deadline.valueOf().toString(),
      identifier: `${auctionData.auctioned_token.token_type
        .valueOf()
        .toString()}-${nominateVal(
        parseInt(auctionData.auctioned_token.nonce.valueOf().toString()),
      )}`,
    });
  }

  private mapEntityToDto(auction: AuctionEntity): Auction {
    return new Auction({
      id: auction.id,
      status: auction.status,
      ownerAddress: auction.ownerAddress,
      token: auction.token,
      nonce: auction.nonce,
      identifier: auction.identifier,
      startDate: auction.startDate,
      endDate: auction.endDate,
      minBid: new Price({
        token: 'EGLD',
        nonce: 1,
        amount: auction.minBid,
      }),
      maxBid: new Price({
        token: 'EGLD',
        nonce: 1,
        amount: auction.maxBid,
      }),
    });
  }
}
