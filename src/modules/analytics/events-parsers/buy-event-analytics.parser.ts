import { Injectable } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { AuctionEventEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService } from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { BuySftEvent, EndAuctionEvent } from 'src/modules/rabbitmq/entities/auction';
import { ClaimEvent } from 'src/modules/rabbitmq/entities/auction/claim.event';
import { ElrondSwapBuyEvent } from 'src/modules/rabbitmq/entities/auction/elrondnftswap/elrondswap-buy.event';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { computeUsd } from 'src/utils/helpers';

@Injectable()
export class BuyEventAnalyticsParser {
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private readonly marketplaceService: MarketplacesService,
    private readonly usdPriceService: UsdPriceService,
  ) {}

  async handle(event: any, timestamp: number) {
    if (event.identifier === AuctionEventEnum.BidEvent)
      if (Buffer.from(event.topics[0], 'base64')?.toString() === ExternalAuctionEventEnum.EndTokenEvent) {
        return this.getBuyNowData(event, timestamp);
      } else return;
    const { buySftEvent, topics } = this.getEventAndTopics(event);
    let auction: AuctionEntity;

    const marketplace = await this.marketplaceService.getMarketplaceByAddress(buySftEvent.getAddress());

    if (!marketplace) return;

    if (topics.auctionId) {
      auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);
    } else {
      const auctionIdentifier = `${topics.collection}-${topics.nonce}`;
      auction = await this.auctionsGetterService.getAuctionByIdentifierAndMarketplace(auctionIdentifier, marketplace.key);
    }
    if (!auction && !topics.paymentToken) return;

    const tokenData = await this.usdPriceService.getToken(auction?.paymentToken ?? topics.paymentToken);
    const tokenPrice = await this.usdPriceService.getTokenPriceFromDate(tokenData.identifier, timestamp);

    const volume = topics.bid === '0' ? auction.minBid : topics.bid;

    const data = [];
    data[topics.collection] = {
      usdPrice: tokenPrice ?? 0,
      volume: BigNumberUtils.denominateAmount(volume, tokenData?.decimals ?? 18),
      volumeUSD:
        volume === '0' || !tokenPrice ? '0' : computeUsd(tokenPrice?.toString() ?? '0', volume, tokenData?.decimals ?? 18).toFixed(),
      paymentToken: tokenData?.identifier,
      marketplaceKey: marketplace.key,
    };
    return data;
  }

  private async getBuyNowData(event: any, timestamp: number) {
    const buySftEvent = new EndAuctionEvent(event);
    const topics = buySftEvent.getTopics();
    const marketplace = await this.marketplaceService.getMarketplaceByAddress(buySftEvent.getAddress());
    if (!marketplace) return;
    const auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);
    if (!auction) return;

    const tokenData = await this.usdPriceService.getToken(auction?.paymentToken);
    const tokenPrice = await this.usdPriceService.getTokenPriceFromDate(tokenData.identifier, timestamp);

    const volume = topics.currentBid;

    const data = [];
    data[topics.collection] = {
      usdPrice: tokenPrice ?? 0,
      volume: BigNumberUtils.denominateAmount(volume, tokenData?.decimals ?? 18),
      volumeUSD:
        volume === '0' || !tokenPrice ? '0' : computeUsd(tokenPrice?.toString() ?? '0', volume, tokenData?.decimals ?? 18).toFixed(),
      paymentToken: tokenData?.identifier,
      marketplaceKey: marketplace.key,
    };
    return data;
  }

  private getEventAndTopics(event: any) {
    if (event.identifier === KroganSwapAuctionEventEnum.Purchase) {
      if (Buffer.from(event.topics[0], 'base64')?.toString() === KroganSwapAuctionEventEnum.UpdateListing) {
        return;
      }
      const buySftEvent = new ElrondSwapBuyEvent(event);
      const topics = buySftEvent.getTopics();
      return { buySftEvent, topics };
    }

    if (event.identifier === ExternalAuctionEventEnum.BuyNft) {
      const buySftEvent = new ClaimEvent(event);
      const topics = buySftEvent.getTopics();
      return { buySftEvent, topics };
    }
    const buySftEvent = new BuySftEvent(event);
    const topics = buySftEvent.getTopics();
    return { buySftEvent, topics };
  }
}
