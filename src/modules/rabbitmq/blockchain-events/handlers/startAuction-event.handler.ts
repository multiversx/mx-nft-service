import { Injectable, Logger } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { AssetByIdentifierService } from 'src/modules/assets';
import { ElrondNftsSwapAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsSetterService } from 'src/modules/auctions';
import { ElrondSwapAuctionTypeEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { ELRONDNFTSWAP_KEY } from 'src/utils/constants';
import { AuctionTokenEvent } from '../../entities/auction';
import { ElrondSwapAuctionEvent } from '../../entities/auction/elrondnftswap/elrondswap-auction.event';
import { FeedEventsSenderService } from '../feed-events.service';

@Injectable()
export class StartAuctionEventHandler {
  private readonly logger = new Logger(StartAuctionEventHandler.name);
  constructor(
    private auctionsService: AuctionsSetterService,
    private feedEventsSenderService: FeedEventsSenderService,
    private assetByIdentifierService: AssetByIdentifierService,
    private usdPriceService: UsdPriceService,
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const { auctionTokenEvent, topics } = this.getEventAndTopics(event);
    if (!auctionTokenEvent && !topics) return;

    const auctionIdentifier = `${topics.collection}-${topics.nonce}`;
    const marketplace = await this.marketplaceService.getMarketplaceByType(
      auctionTokenEvent.getAddress(),
      marketplaceType,
      topics.collection,
    );

    if (!marketplace) return;
    this.logger.log(
      `Auction listing event detected for hash '${hash}' and marketplace '${marketplace?.name}'`,
    );
    const auction = await this.saveAuction(
      topics,
      auctionIdentifier,
      marketplace,
      hash,
    );

    if (!auction) return;

    await this.feedEventsSenderService.sendStartAuctionEvent(
      topics,
      auction,
      marketplace,
    );
  }

  private async saveAuction(
    topics: any,
    auctionIdentifier: string,
    marketplace: Marketplace,
    hash: string,
  ) {
    if (marketplace.key === ELRONDNFTSWAP_KEY) {
      return await this.handleElrondSwapAuction(
        auctionIdentifier,
        topics,
        hash,
        marketplace,
      );
    }
    return await this.auctionsService.saveAuction(
      parseInt(topics.auctionId, 16),
      auctionIdentifier,
      marketplace,
      hash,
    );
  }

  private async handleElrondSwapAuction(
    auctionIdentifier: string,
    topics: any,
    hash: string,
    auctionTokenEventMarketplace: Marketplace,
  ) {
    const asset = await this.assetByIdentifierService.getAsset(
      auctionIdentifier,
    );

    const paymentToken = await this.usdPriceService.getToken(
      topics.paymentToken,
    );
    return await this.auctionsService.saveAuctionEntity(
      AuctionEntity.fromWithdrawTopics(
        topics,
        asset.tags?.toString(),
        hash,
        auctionTokenEventMarketplace.key,
        paymentToken?.decimals,
      ),
      asset.tags,
    );
  }

  private getEventAndTopics(event: any) {
    if (event.identifier === ElrondNftsSwapAuctionEventEnum.NftSwap) {
      const auctionTokenEvent = new ElrondSwapAuctionEvent(event);
      const topics = auctionTokenEvent.getTopics();
      if (parseInt(topics.auctionType) === ElrondSwapAuctionTypeEnum.Swap) {
        return { auctionTokenEvent: null, topics: null };
      }
      return { auctionTokenEvent, topics };
    }
    const auctionTokenEvent = new AuctionTokenEvent(event);
    const topics = auctionTokenEvent.getTopics();
    return { auctionTokenEvent, topics };
  }
}
