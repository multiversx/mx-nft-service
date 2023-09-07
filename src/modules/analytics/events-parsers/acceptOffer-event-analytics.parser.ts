import { Injectable } from '@nestjs/common';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { AcceptOfferEvent } from 'src/modules/rabbitmq/entities/auction/acceptOffer.event';
import { AcceptOfferDeadrareEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferDeadrare.event';
import { AcceptOfferFrameitEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferFrameit.event';
import { AcceptOfferXoxnoEvent } from 'src/modules/rabbitmq/entities/auction/acceptOfferXoxno.event';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DEADRARE_KEY, FRAMEIT_KEY, XOXNO_KEY } from 'src/utils/constants';
import { computeUsd } from 'src/utils/helpers';

@Injectable()
export class AcceptOfferEventAnalyticsParser {
  constructor(private readonly marketplaceService: MarketplacesService, private readonly usdPriceService: UsdPriceService) {}

  async handle(event: any, timestamp: number) {
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(event.address);
    let acceptOfferEvent = undefined;
    let topics = undefined;
    if (marketplace.key === XOXNO_KEY && !(Buffer.from(event.topics[0], 'base64').toString() === ExternalAuctionEventEnum.UserDeposit)) {
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
      const tokenData = await this.usdPriceService.getToken(topics.paymentTokenIdentifier);
      const tokenPrice = await this.usdPriceService.getTokenPriceFromDate(topics.paymentTokenIdentifier, timestamp);
      const data = [];
      data[topics.collection] = {
        usdPrice: tokenPrice,
        volume: BigNumberUtils.denominateAmount(topics.paymentAmount, tokenData?.decimals),
        volumeUSD: !tokenData ? '0' : computeUsd(tokenPrice.toString(), topics.paymentAmount, tokenData.decimals).toFixed(),
        paymentToken: tokenData?.identifier,
        marketplaceKey: marketplace.key,
      };
      return data;
    }
  }
}
