import { Injectable, Logger } from '@nestjs/common';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import {
  AuctionsGetterService,
  AuctionsSetterService,
} from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { XOXNO_KEY } from 'src/utils/constants';
import { AcceptOfferEvent } from '../../entities/auction/acceptOffer.event';

@Injectable()
export class AcceptOfferEventHandler {
  private readonly logger = new Logger(AcceptOfferEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const acceptOfferEvent = new AcceptOfferEvent(event);
    const topics = acceptOfferEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      acceptOfferEvent.getAddress(),
      marketplaceType,
      topics.collection,
    );
    this.logger.log(
      `Accept Offer event detected for hash '${hash}' and marketplace '${marketplace?.name}'`,
    );

    if (marketplace.key !== XOXNO_KEY || topics.auctionId <= 0) {
      return;
    }

    let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(
      topics.auctionId,
      marketplace.key,
    );
    if (!auction) return;

    auction.status = AuctionStatusEnum.Closed;
    auction.modifiedDate = new Date(new Date().toUTCString());
    this.auctionsService.updateAuctionPrice(
      auction,
      ExternalAuctionEventEnum.AcceptOffer,
    );
  }
}
