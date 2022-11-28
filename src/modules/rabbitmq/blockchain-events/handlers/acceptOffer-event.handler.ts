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
    const topicsAcceptOffer = acceptOfferEvent.getTopics();
    const acceptOfferMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        acceptOfferEvent.getAddress(),
        marketplaceType,
        topicsAcceptOffer.collection,
      );
    this.logger.log(
      `Accept Offer event detected for hash '${hash}' and marketplace '${acceptOfferMarketplace?.name}'`,
    );

    if (
      acceptOfferMarketplace.key !== XOXNO_KEY ||
      topicsAcceptOffer.auctionId <= 0
    ) {
      return;
    }

    let updatePriceAuction =
      await this.auctionsGetterService.getAuctionByIdAndMarketplace(
        topicsAcceptOffer.auctionId,
        acceptOfferMarketplace.key,
      );
    if (!updatePriceAuction) return;

    updatePriceAuction.status = AuctionStatusEnum.Closed;
    updatePriceAuction.modifiedDate = new Date(new Date().toUTCString());
    this.auctionsService.updateAuction(
      updatePriceAuction,
      ExternalAuctionEventEnum.AcceptOffer,
    );
  }
}
