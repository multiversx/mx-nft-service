import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OffersService } from 'src/modules/offers/offers.service';
import { WithdrawOfferEvent } from '../../entities/auction/withdrawOffer.event';

@Injectable()
export class WithdrawOfferEventHandler {
  private readonly logger = new Logger(WithdrawOfferEventHandler.name);
  constructor(
    private readonly offersService: OffersService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    if (marketplaceType === MarketplaceTypeEnum.External) {
      return;
    }
    const withdrawOfferEvent = new WithdrawOfferEvent(event);
    const topics = withdrawOfferEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      withdrawOfferEvent.getAddress(),
      marketplaceType,
      topics.collection,
    );

    if (!marketplace) {
      return;
    }
    this.logger.log(`Withdraw Offer event detected for hash '${hash}' and marketplace '${marketplace?.name}'`);

    const withdrawOffer = await this.offersService.getOfferByIdAndMarketplace(topics.offerId, marketplace.key);

    if (!withdrawOffer) return;
    const offer = await this.offersService.saveOffer({
      ...withdrawOffer,
      status: OfferStatusEnum.Closed,
      modifiedDate: new Date(new Date().toUTCString()),
    });

    this.notificationsService.updateNotificationStatusForOffers([offer.identifier]);
  }
}
