import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { XOXNO_KEY } from 'src/utils/constants';
import { AcceptGlobalOfferEvent } from '../../entities/auction/acceptGlobalOffer.event';

@Injectable()
export class AcceptGlobalOfferEventHandler {
  private readonly logger = new Logger(AcceptGlobalOfferEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const acceptGlobalOfferEvent = new AcceptGlobalOfferEvent(event);
    const topics = acceptGlobalOfferEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(acceptGlobalOfferEvent.getAddress(), marketplaceType);
    this.logger.log(`Accept Global Offer event detected for hash '${hash}' and marketplace '${marketplace?.name}'`);
    if (marketplace.key !== XOXNO_KEY || topics.auctionId <= 0) {
      return;
    }

    let auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(topics.auctionId, marketplace.key);

    if (!auction) return;
    auction.status = AuctionStatusEnum.Closed;
    auction.modifiedDate = new Date(new Date().toUTCString());
    this.auctionsService.updateAuction(auction, ExternalAuctionEventEnum.AcceptGlobalOffer);
  }
}
