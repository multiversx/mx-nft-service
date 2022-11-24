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
    const { auctionToken, topicsAuctionToken } = this.getEventAndTopics(event);
    if (!auctionToken && !topicsAuctionToken) return;

    const startAuctionIdentifier = `${topicsAuctionToken.collection}-${topicsAuctionToken.nonce}`;
    const auctionTokenMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        auctionToken.getAddress(),
        marketplaceType,
        topicsAuctionToken.collection,
      );

    if (!auctionTokenMarketplace) return;
    this.logger.log(
      `Auction listing event detected for hash '${hash}' and marketplace '${auctionTokenMarketplace?.name}'`,
    );
    const startAuction = await this.saveAuction(
      topicsAuctionToken,
      startAuctionIdentifier,
      auctionTokenMarketplace,
      hash,
    );

    if (!startAuction) return;

    await this.feedEventsSenderService.sendStartAuctionEvent(
      topicsAuctionToken,
      startAuction,
      auctionTokenMarketplace,
    );
  }

  private async saveAuction(
    topicsAuctionToken: any,
    startAuctionIdentifier: string,
    auctionTokenMarketplace: Marketplace,
    hash: string,
  ) {
    if (auctionTokenMarketplace.key === ELRONDNFTSWAP_KEY) {
      return await this.handleElrondSwapAuction(
        startAuctionIdentifier,
        topicsAuctionToken,
        hash,
        auctionTokenMarketplace,
      );
    }
    return await this.auctionsService.saveAuction(
      parseInt(topicsAuctionToken.auctionId, 16),
      startAuctionIdentifier,
      auctionTokenMarketplace,
      hash,
    );
  }

  private async handleElrondSwapAuction(
    startAuctionIdentifier: string,
    topicsAuctionToken: any,
    hash: string,
    auctionTokenMarketplace: Marketplace,
  ) {
    const asset = await this.assetByIdentifierService.getAsset(
      startAuctionIdentifier,
    );

    const paymentToken = await this.usdPriceService.getToken(
      topicsAuctionToken.paymentToken,
    );
    return await this.auctionsService.saveAuctionEntity(
      AuctionEntity.fromWithdrawTopics(
        topicsAuctionToken,
        asset.tags?.toString(),
        hash,
        auctionTokenMarketplace.key,
        paymentToken?.decimals,
      ),
      asset.tags,
    );
  }

  private getEventAndTopics(event: any) {
    if (event.identifier === ElrondNftsSwapAuctionEventEnum.NftSwap) {
      const auctionToken = new ElrondSwapAuctionEvent(event);
      const topicsAuctionToken = auctionToken.getTopics();
      if (
        parseInt(topicsAuctionToken.auctionType) ===
        ElrondSwapAuctionTypeEnum.Swap
      ) {
        return;
      }
      return { auctionToken, topicsAuctionToken };
    }
    const auctionToken = new AuctionTokenEvent(event);
    const topicsAuctionToken = auctionToken.getTopics();
    return { auctionToken, topicsAuctionToken };
  }
}
