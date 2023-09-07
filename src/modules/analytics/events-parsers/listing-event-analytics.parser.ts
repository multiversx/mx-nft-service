import { Injectable } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { ElrondSwapAuctionTypeEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { AuctionTokenEvent } from '../../rabbitmq/entities/auction';
import { ElrondSwapAuctionEvent } from '../../rabbitmq/entities/auction/elrondnftswap/elrondswap-auction.event';
import { ListNftEvent } from '../../rabbitmq/entities/auction/listNft.event';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { computeUsd } from 'src/utils/helpers';

@Injectable()
export class ListingAuctionAnalyticsHandler {
  constructor(private usdPriceService: UsdPriceService, private readonly marketplaceService: MarketplacesService) {}

  async handle(event: any, timestamp: number) {
    const { auctionTokenEvent, topics } = this.getEventAndTopics(event);
    if (!auctionTokenEvent && !topics) return;

    const marketplace = await this.marketplaceService.getMarketplaceByAddress(auctionTokenEvent.getAddress());

    if (!marketplace) return;

    const tokenData = await this.usdPriceService.getToken(topics.paymentToken ?? mxConfig.egld);
    const tokenPrice = await this.usdPriceService.getTokenPriceFromDate(tokenData.identifier, timestamp);

    const data = [];

    const floorPrice = BigNumberUtils.denominateAmount(topics.price, tokenData?.decimals ?? 18);

    if (floorPrice < Math.pow(10, 128)) {
      data[topics.collection] = {
        usdPrice: tokenPrice ?? 0,
        floorPrice: floorPrice,
        floorPriceUSD:
          topics.price === '0' || !tokenPrice
            ? '0'
            : computeUsd(tokenPrice?.toString() ?? '0', topics.price, tokenData?.decimals ?? 18).toFixed(),
        paymentToken: tokenData?.identifier,
        marketplaceKey: marketplace.key,
      };

      return data;
    }
  }

  private getEventAndTopics(event: any) {
    if (event.identifier === KroganSwapAuctionEventEnum.NftSwap) {
      const auctionTokenEvent = new ElrondSwapAuctionEvent(event);
      const topics = auctionTokenEvent.getTopics();
      if (parseInt(topics.auctionType) === ElrondSwapAuctionTypeEnum.Swap) {
        return { auctionTokenEvent: null, topics: null };
      }
      return { auctionTokenEvent, topics };
    }

    if (event.identifier === ExternalAuctionEventEnum.ListNftOnMarketplace) {
      const auctionTokenEvent = new ListNftEvent(event);
      const topics = auctionTokenEvent.getTopics();
      return { auctionTokenEvent, topics };
    }
    const auctionTokenEvent = new AuctionTokenEvent(event);
    const topics = auctionTokenEvent.getTopics();
    return { auctionTokenEvent, topics };
  }
}
