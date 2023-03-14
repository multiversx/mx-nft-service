import { Injectable } from '@nestjs/common';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { AcceptOfferEvent } from 'src/modules/rabbitmq/entities/auction/acceptOffer.event';
import { AcceptOfferDeadrareEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferDeadrare.event';
import { AcceptOfferFrameitEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferFrameit.event';
import { AcceptOfferXoxnoEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferXoxno.event';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { DEADRARE_KEY, FRAMEIT_KEY, XOXNO_KEY } from 'src/utils/constants';
import { computeUsd } from 'src/utils/helpers';

@Injectable()
export class AcceptOfferEventParser {
  constructor(
    private readonly marketplaceService: MarketplacesService,
    private readonly usdPriceService: UsdPriceService,
  ) {}

  async handle(event: any) {
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(
      event.address,
    );
    let acceptOfferEvent = undefined;
    let topics = undefined;
    if (
      marketplace.key === XOXNO_KEY &&
      !(
        Buffer.from(event.topics[0], 'base64').toString() ===
        ExternalAuctionEventEnum.UserDeposit
      )
    ) {
      acceptOfferEvent = new AcceptOfferXoxnoEvent(event);
      topics = acceptOfferEvent.getTopics();
    }

    if (marketplace.key === DEADRARE_KEY) {
      acceptOfferEvent = new AcceptOfferDeadrareEvent(event);
      topics = acceptOfferEvent.getTopics();
    }

    if (marketplace.key === FRAMEIT_KEY) {
      acceptOfferEvent = new AcceptOfferFrameitEvent(event);
      topics = acceptOfferEvent.getTopics();
    }
    if (marketplace.type === MarketplaceTypeEnum.Internal) {
      acceptOfferEvent = new AcceptOfferEvent(event);
      topics = acceptOfferEvent.getTopics();
    }
    if (acceptOfferEvent && topics) {
      const tokenData = await this.usdPriceService.getToken(
        topics.paymentTokenIdentifier,
      );

      return [
        {
          collection: topics.collection,
          paymentToken: topics.paymentTokenIdentifier,
          paymentNonce: topics.paymentTokenNonce,
          usdPrice: tokenData.priceUsd,
          decimals: tokenData.decimals,
          volume: topics.paymentAmount,
          volumeUSD: computeUsd(
            tokenData.priceUsd,
            topics.paymentAmount,
            tokenData.decimals,
          ).toFixed(),
        },
      ];
    }
  }
}
