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
import { AcceptGlobalOfferEvent } from '../../entities/auction/acceptGlobalOffer.event';

@Injectable()
export class AcceptGlobalOfferEventHandler {
  private readonly logger = new Logger(AcceptGlobalOfferEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const acceptGlobalOfferEvent = new AcceptGlobalOfferEvent(event);
    const topicsAcceptGlobalOffer = acceptGlobalOfferEvent.getTopics();
    const acceptGlobalOfferMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        acceptGlobalOfferEvent.getAddress(),
        marketplaceType,
      );
    this.logger.log(
      `Accept Global Offer event detected for hash '${hash}' and marketplace '${acceptGlobalOfferMarketplace?.name}'`,
    );
    if (
      acceptGlobalOfferMarketplace.key !== XOXNO_KEY ||
      topicsAcceptGlobalOffer.auctionId <= 0
    ) {
      return;
    }

    let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(
      topicsAcceptGlobalOffer.auctionId,
      acceptGlobalOfferMarketplace.key,
    );

    if (!auction) return;
    auction.status = AuctionStatusEnum.Closed;
    auction.modifiedDate = new Date(new Date().toUTCString());
    this.auctionsService.updateAuction(
      auction,
      ExternalAuctionEventEnum.AcceptGlobalOffer,
    );
  }
}
