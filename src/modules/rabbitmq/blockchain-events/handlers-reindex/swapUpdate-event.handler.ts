import { Injectable, Logger } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions';
import { KroganSwapAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { ElrondSwapUpdateEvent } from '../../entities/auction-reindex/elrondnftswap/elrondswap-updateAuction.event';
import { Marketplace } from 'src/modules/marketplaces/models';

@Injectable()
export class SwapUpdateEventHandler {
  private readonly logger = new Logger(SwapUpdateEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private usdPriceService: UsdPriceService,
  ) { }

  async handle(event: any, marketplace: Marketplace) {
    try {
      const updateEvent = new ElrondSwapUpdateEvent(event);
      const topics = updateEvent.getTopics();
      this.logger.log(`${updateEvent.identifier}  auction event detected for marketplace '${marketplace?.name}'`);
      let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);

      if (auction) {
        await this.updateAuctionPrice(auction, topics);
        this.auctionsService.updateAuction(auction, KroganSwapAuctionEventEnum.NftSwapUpdate);
      }
    } catch (error) {
      console.error('An errror occured while handling bid event', error);
    }
  }

  private async updateAuctionPrice(
    auction: AuctionEntity,
    topics: {
      seller: string;
      collection: string;
      nonce: string;
      auctionId: string;
      nrAuctionTokens: number;
      price: string;
      deadline: number;
    },
  ) {
    const paymentToken = await this.usdPriceService.getToken(auction.paymentToken);
    const decimals = paymentToken?.decimals ?? mxConfig.decimals;
    auction.minBid = topics.price;
    auction.minBidDenominated = BigNumberUtils.denominateAmount(topics.price, decimals);
    auction.maxBid = auction.minBid;
    auction.maxBidDenominated = auction.minBidDenominated;
    auction.endDate = topics.deadline;
    auction.nrAuctionedTokens = topics.nrAuctionTokens;
    auction.blockHash = 'hash';
  }
}
