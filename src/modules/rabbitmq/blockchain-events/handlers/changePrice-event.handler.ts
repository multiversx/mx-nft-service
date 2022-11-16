import { Injectable, Logger } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions';
import { ExternalAuctionEventEnum } from 'src/modules/assets/models';
import {
  AuctionsGetterService,
  AuctionsSetterService,
} from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { ChangePriceEvent } from '../../entities/auction/changePrice.event';

@Injectable()
export class ChangePriceEventHandler {
  private readonly logger = new Logger(ChangePriceEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private readonly marketplaceService: MarketplacesService,
    private usdPriceService: UsdPriceService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const changePriceEvent = new ChangePriceEvent(event);
    const topicsChangePrice = changePriceEvent.getTopics();
    const changePriceMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        changePriceEvent.getAddress(),
        marketplaceType,
        topicsChangePrice.collection,
      );
    this.logger.log(
      `Change price event detected for hash '${hash}' and marketplace '${changePriceMarketplace?.name}'`,
    );
    let changePriceAuction =
      await this.auctionsGetterService.getAuctionByIdAndMarketplace(
        parseInt(topicsChangePrice.auctionId, 16),
        changePriceMarketplace.key,
      );

    if (changePriceAuction) {
      const paymentToken = await this.usdPriceService.getToken(
        changePriceAuction.paymentToken,
      );
      this.updateAuctionPrice(
        changePriceAuction,
        topicsChangePrice.newBid,
        hash,
        paymentToken?.decimals,
      );

      this.auctionsService.updateAuction(
        changePriceAuction,
        ExternalAuctionEventEnum.ChangePrice,
      );
    }
  }

  private updateAuctionPrice(
    changePriceAuction: AuctionEntity,
    newBid: string,
    hash: string,
    decimals: number = elrondConfig.decimals,
  ) {
    changePriceAuction.minBid = newBid;
    changePriceAuction.minBidDenominated = BigNumberUtils.denominateAmount(
      newBid,
      decimals,
    );
    changePriceAuction.maxBid = newBid;
    changePriceAuction.maxBidDenominated = BigNumberUtils.denominateAmount(
      newBid,
      decimals,
    );
    changePriceAuction.blockHash = hash;
  }
}
