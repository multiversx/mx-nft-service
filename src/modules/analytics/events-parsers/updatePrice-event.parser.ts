import { Injectable } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { computeUsd } from 'src/utils/helpers';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DEADRARE_KEY, FRAMEIT_KEY, XOXNO_KEY } from 'src/utils/constants';
import { UpdatePriceEvent } from 'src/modules/rabbitmq/entities/auction/updatePrice.event';

@Injectable()
export class UpdatePriceEventParser {
  constructor(private readonly marketplaceService: MarketplacesService, private usdPriceService: UsdPriceService) {}

  async handle(event: any, timestamp: number) {
    const updatePriceEvent = new UpdatePriceEvent(event);
    const topics = updatePriceEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(updatePriceEvent.getAddress());

    if (!marketplace) return;
    const paymentToken = this.getPaymentToken(marketplace.key, event.topics);
    const tokenData = await this.usdPriceService.getToken(paymentToken ?? mxConfig.egld);
    const tokenPrice = await this.usdPriceService.getTokenPriceFromDate(tokenData.identifier, timestamp);

    const data = [];
    let newPrice = BigNumberUtils.denominateAmount(topics.newBid, tokenData?.decimals ?? 18);

    if (newPrice && newPrice < Math.pow(10, 128)) {
      data[topics.collection] = {
        usdPrice: tokenPrice ?? 0,
        floorPrice: newPrice,
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

  private getPaymentToken(marketplaceKey: string, rawTopics: string[]) {
    if (marketplaceKey === DEADRARE_KEY) {
      return Buffer.from(rawTopics[8] ?? '', 'base64').toString();
    }
    if (marketplaceKey === XOXNO_KEY) {
      return Buffer.from(rawTopics[7] ?? '', 'base64').toString();
    }
    if (marketplaceKey === FRAMEIT_KEY) {
      return Buffer.from(rawTopics[4] ?? '', 'base64').toString();
    }
  }
}
