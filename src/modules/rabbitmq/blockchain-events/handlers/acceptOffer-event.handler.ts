import { Injectable, Logger } from '@nestjs/common';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import {
  AuctionsGetterService,
  AuctionsSetterService,
} from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OffersService } from 'src/modules/offers/offers.service';
import { XOXNO_KEY } from 'src/utils/constants';
import { AcceptOfferEvent } from '../../entities/auction/acceptOffer.event';
import { FeedEventsSenderService } from '../feed-events.service';

@Injectable()
export class AcceptOfferEventHandler {
  private readonly logger = new Logger(AcceptOfferEventHandler.name);
  constructor(
    private readonly auctionsGetterService: AuctionsGetterService,
    private readonly auctionsService: AuctionsSetterService,
    private readonly offersService: OffersService,
    private readonly marketplaceService: MarketplacesService,
    private readonly feedEventsSenderService: FeedEventsSenderService,
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

    if (
      marketplace.key !== XOXNO_KEY &&
      marketplace.type === MarketplaceTypeEnum.External
    ) {
      return;
    }

    const offer = await this.offersService.getOfferByIdAndMarketplace(
      topics.offerId,
      marketplace.key,
    );

    await this.offersService.saveOffer({
      ...offer,
      status: OfferStatusEnum.Accepted,
    });

    if (topics.auctionId || topics.auctionId !== 0) {
      let auction =
        await this.auctionsGetterService.getAuctionByIdAndMarketplace(
          topics.auctionId,
          marketplace.key,
        );
      if (!auction) return;

      auction.status = AuctionStatusEnum.Closed;
      auction.modifiedDate = new Date(new Date().toUTCString());
      this.auctionsService.updateAuction(
        auction,
        ExternalAuctionEventEnum.AcceptOffer,
      );
    }

    await this.feedEventsSenderService.sendAcceptOfferEvent(
      topics.nftOwner,
      offer,
    );
  }
}
