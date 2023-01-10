import { Injectable, Logger } from '@nestjs/common';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OfferStatusEnum } from 'src/modules/offers/models';
import { OffersService } from 'src/modules/offers/offers.service';
import { SendOfferEvent } from '../../entities/auction/sendOffer.event';

@Injectable()
export class WithdrawOfferEventHandler {
  private readonly logger = new Logger(WithdrawOfferEventHandler.name);
  constructor(
    private readonly offersService: OffersService,
    private readonly notificationsService: NotificationsService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const sendOffer = new SendOfferEvent(event);
    const topics = sendOffer.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      sendOffer.getAddress(),
      marketplaceType,
      topics.collection,
    );

    if (!marketplace || marketplace.type === MarketplaceTypeEnum.External) {
      return;
    }
    this.logger.log(
      `Withdraw Offer event detected for hash '${hash}' and marketplace '${marketplace?.name}'`,
    );

    const withdrawOffer = await this.offersService.getOfferByIdAndMarketplace(
      topics.offerId,
      marketplace.key,
    );

    if (!withdrawOffer) return;
    const offer = await this.offersService.saveOffer({
      ...withdrawOffer,
      status: OfferStatusEnum.Closed,
      modifiedDate: new Date(new Date().toUTCString()),
    });

    this.notificationsService.updateNotificationStatusForOffers([
      offer.identifier,
    ]);
  }
}
