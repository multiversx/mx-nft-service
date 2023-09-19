import { Injectable } from '@nestjs/common';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { UpdateListingEvent } from '../../rabbitmq/entities/auction/updateListing.event';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { computeUsd } from 'src/utils/helpers';
import { mxConfig } from 'src/config';

@Injectable()
export class UpdateListingEventParser {
  constructor(private readonly marketplaceService: MarketplacesService, private readonly usdPriceService: UsdPriceService) {}

  async handle(event: any, timestamp: number) {
    const updateListingEvent = new UpdateListingEvent(event);
    const topics = updateListingEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(updateListingEvent.getAddress());

    if (!marketplace) return;

    const tokenData = await this.usdPriceService.getToken(topics.paymentToken ?? mxConfig.egld);
    const tokenPrice = await this.usdPriceService.getTokenPriceFromDate(tokenData.identifier, timestamp);

    const data = [];
    const newFloorPrice = BigNumberUtils.denominateAmount(topics.newBid, tokenData?.decimals ?? 18);
    if (newFloorPrice < Math.pow(10, 128)) {
      data[topics.collection] = {
        usdPrice: tokenPrice ?? 0,
        floorPrice: newFloorPrice,
        floorPriceUSD:
          topics.newBid === '0' || !tokenPrice
            ? '0'
            : computeUsd(tokenPrice?.toString() ?? '0', topics.newBid, tokenData?.decimals ?? 18).toFixed(),
        paymentToken: tokenData?.identifier,
        marketplaceKey: marketplace.key,
      };

      return data;
    }
  }
}
