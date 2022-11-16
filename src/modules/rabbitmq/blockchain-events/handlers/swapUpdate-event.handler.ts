import { Injectable, Logger } from '@nestjs/common';
import { elrondConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions';
import { ElrondNftsSwapAuctionEventEnum } from 'src/modules/assets/models';
import {
  AuctionsGetterService,
  AuctionsSetterService,
} from 'src/modules/auctions';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { Marketplace } from 'src/modules/marketplaces/models';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { ElrondSwapUpdateEvent } from '../../entities/auction/elrondnftswap/elrondswap-updateAuction.event';

@Injectable()
export class SwapUpdateEventHandler {
  private readonly logger = new Logger(SwapUpdateEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    private readonly marketplaceService: MarketplacesService,
    private usdPriceService: UsdPriceService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const updateEvent = new ElrondSwapUpdateEvent(event);
    const topicsUpdate = updateEvent.getTopics();
    const changePriceMarketplace: Marketplace =
      await this.marketplaceService.getMarketplaceByType(
        updateEvent.getAddress(),
        marketplaceType,
      );
    this.logger.log(
      `Udpdate auction event detected for hash '${hash}' and marketplace '${changePriceMarketplace?.name}'`,
    );
    let changePriceAuction =
      await this.auctionsGetterService.getAuctionByIdAndMarketplace(
        parseInt(topicsUpdate.auctionId, 16),
        changePriceMarketplace.key,
      );

    if (changePriceAuction) {
      this.updateAuctionPrice(changePriceAuction, topicsUpdate, hash);

      this.auctionsService.updateAuction(
        changePriceAuction,
        ElrondNftsSwapAuctionEventEnum.NftSwapUpdate,
      );
    }
  }

  private async updateAuctionPrice(
    changePriceAuction: AuctionEntity,
    topics: {
      seller: string;
      collection: string;
      nonce: string;
      auctionId: string;
      nrAuctionTokens: number;
      price: string;
      deadline: number;
    },
    hash: string,
  ) {
    const paymentToken = await this.usdPriceService.getToken(
      changePriceAuction.paymentToken,
    );
    const decimals = paymentToken?.decimals ?? elrondConfig.decimals;
    changePriceAuction.minBid = topics.price;
    changePriceAuction.minBidDenominated = BigNumberUtils.denominateAmount(
      topics.price,
      decimals,
    );
    changePriceAuction.endDate = topics.deadline;
    changePriceAuction.nrAuctionedTokens = topics.nrAuctionTokens;
    changePriceAuction.blockHash = hash;
  }
}
