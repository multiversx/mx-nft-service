import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions';
import { AssetByIdentifierService } from 'src/modules/assets';
import { ExternalAuctionEventEnum, KroganSwapAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { ElrondSwapAuctionTypeEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { ELRONDNFTSWAP_KEY, ENEFTOR_KEY } from 'src/utils/constants';
import { AuctionTokenEvent } from '../../entities/auction';
import { ElrondSwapAuctionEvent } from '../../entities/auction/elrondnftswap/elrondswap-auction.event';
import { ListNftEvent } from '../../entities/auction/listNft.event';
import { FeedEventsSenderService } from '../feed-events.service';

@Injectable()
export class StartAuctionEventHandler {
  private readonly logger = new Logger(StartAuctionEventHandler.name);
  constructor(
    private auctionsSetterService: AuctionsSetterService,
    private auctionsGetterService: AuctionsGetterService,
    private feedEventsSenderService: FeedEventsSenderService,
    @Inject(forwardRef(() => AssetByIdentifierService))
    private assetByIdentifierService: AssetByIdentifierService,
    private usdPriceService: UsdPriceService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const { auctionTokenEvent, topics } = this.getEventAndTopics(event);
    if (!auctionTokenEvent && !topics) return;

    const marketplace = await this.marketplaceService.getMarketplaceByType(
      auctionTokenEvent.getAddress(),
      marketplaceType,
      topics.collection,
    );

    if (!marketplace) return;
    this.logger.log(
      `${auctionTokenEvent.getIdentifier()} listing event detected for hash '${hash}' and marketplace '${marketplace?.name}'`,
    );
    const auction = await this.saveAuction(topics, marketplace, hash);

    if (!auction) return;

    await this.feedEventsSenderService.sendStartAuctionEvent(topics, auction, marketplace);
  }

  private async saveAuction(topics: any, marketplace: Marketplace, hash: string) {
    const auctionIdentifier = `${topics.collection}-${topics.nonce}`;
    if (marketplace.key === ELRONDNFTSWAP_KEY || marketplace.key === ENEFTOR_KEY) {
      if (topics.auctionId === '0') {
        let auctionId = await this.auctionsGetterService.getLastAuctionIdForMarketplace(marketplace.key);
        topics.auctionId = (auctionId && auctionId > 0 ? auctionId + 1 : 1).toString(16);
      }
      return await this.handleSaveAuctionFromTopics(auctionIdentifier, topics, hash, marketplace);
    }

    return await this.auctionsSetterService.saveAuction(parseInt(topics.auctionId, 16), auctionIdentifier, marketplace, hash);
  }

  private async handleSaveAuctionFromTopics(
    auctionIdentifier: string,
    topics: any,
    hash: string,
    auctionTokenEventMarketplace: Marketplace,
  ) {
    let decimals = mxConfig.decimals;
    const asset = await this.assetByIdentifierService.getAsset(auctionIdentifier);
    if (topics.paymentToken !== mxConfig.egld) {
      const paymentToken = await this.usdPriceService.getToken(topics.paymentToken);
      decimals = paymentToken.decimals;
    }
    return await this.auctionsSetterService.saveAuctionEntity(
      AuctionEntity.fromWithdrawTopics(topics, asset.tags?.toString(), hash, auctionTokenEventMarketplace.key, decimals),
      asset.tags,
    );
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
