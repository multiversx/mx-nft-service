import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AuctionEntity } from 'src/db/auctions';
import { AuctionEventEnum, KroganSwapAuctionEventEnum, ExternalAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionsGetterService, AuctionsSetterService } from 'src/modules/auctions';
import { AuctionStatusEnum } from 'src/modules/auctions/models';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplaceTypeEnum } from 'src/modules/marketplaces/models/MarketplaceType.enum';
import { WithdrawEvent } from '../../entities/auction';
import { ClaimEvent } from '../../entities/auction/claim.event';
import { ElrondSwapWithdrawEvent } from '../../entities/auction/elrondnftswap/elrondswap-withdraw.event';

@Injectable()
export class WithdrawAuctionEventHandler {
  private readonly logger = new Logger(WithdrawAuctionEventHandler.name);
  constructor(
    private auctionsGetterService: AuctionsGetterService,
    private auctionsService: AuctionsSetterService,
    @Inject(forwardRef(() => MarketplacesService))
    private readonly marketplaceService: MarketplacesService,
  ) {}

  async handle(event: any, hash: string, marketplaceType: MarketplaceTypeEnum) {
    const { withdraw, topics } = this.getEventAndTopics(event);
    let auction: AuctionEntity;
    const marketplace = await this.marketplaceService.getMarketplaceByType(withdraw.getAddress(), marketplaceType, topics.collection);
    if (!marketplace) return;

    this.logger.log(`${withdraw.getIdentifier()} event detected for hash '${hash}' and marketplace '${marketplace?.name}'`);
    if (topics.auctionId) {
      auction = await this.auctionsGetterService.getAuctionByIdAndMarketplace(parseInt(topics.auctionId, 16), marketplace.key);
    } else {
      const auctionIdentifier = `${topics.collection}-${topics.nonce}`;
      auction = await this.auctionsGetterService.getAuctionByIdentifierAndMarketplace(auctionIdentifier, marketplace.key);
    }

    if (!auction) return;

    this.auctionsService.updateAuctionStatus(auction.id, AuctionStatusEnum.Closed, hash, AuctionEventEnum.WithdrawEvent);
  }

  private getEventAndTopics(event: any) {
    if (event.identifier === KroganSwapAuctionEventEnum.WithdrawSwap) {
      const withdraw = new ElrondSwapWithdrawEvent(event);
      const topics = withdraw.getTopics();
      return { withdraw, topics };
    }

    if (event.identifier === ExternalAuctionEventEnum.ClaimBackNft) {
      const withdraw = new ClaimEvent(event);
      const topics = withdraw.getTopics();
      return { withdraw, topics };
    }

    const withdraw = new WithdrawEvent(event);
    const topics = withdraw.getTopics();
    return { withdraw, topics };
  }
}
