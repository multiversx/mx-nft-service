import { Injectable, Logger } from '@nestjs/common';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { XOXNO_KEY } from 'src/utils/constants';
import { AcceptGlobalOfferEvent } from '../../entities/auction-reindex/acceptGlobalOffer.event';
import { Marketplace } from 'src/modules/marketplaces/models';
import { EventLog } from 'src/modules/metrics/rabbitEvent';

@Injectable()
export class AcceptGlobalOfferEventHandler {
  private readonly logger = new Logger(AcceptGlobalOfferEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
  ) { }

  async handle(event: EventLog, marketplace: Marketplace) {
    try {
      const acceptGlobalOfferEvent = new AcceptGlobalOfferEvent(event);
      const topics = acceptGlobalOfferEvent.getTopics();
      this.logger.log(`Accept Global Offer event detected for  marketplace '${marketplace?.name}'`);
      if (marketplace.key !== XOXNO_KEY || topics.auctionId <= 0) {
        return;
      }

      let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(topics.auctionId, marketplace.key);

      if (!auction) return;
      auction.status = AuctionStatusEnum.Closed;
      auction.modifiedDate = new Date(new Date().toUTCString());
      this.auctionsService.updateAuction(auction, ExternalAuctionEventEnum.AcceptGlobalOffer);
    } catch (error) {
      console.error('An errror occured while handling bid event', error);
    }
  }
}
