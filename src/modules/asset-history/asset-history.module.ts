import { forwardRef, Module } from '@nestjs/common';
import { AssetsHistoryResolver, AssetsHistoryService } from '.';
import { ElrondCommunicationModule } from 'src/common';
import { AssetHistoryAccountResolver } from './asset-history-account-resolver';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { CommonModule } from 'src/common.module';
import { AssetsHistoryAuctionService } from './services/assets-history.auction.service';
import { AssetsHistoryExternalAuctionService } from './services/assets-history.external-auction.service';
import { AssetsHistoryNftEventService } from './services/assets-history.nft-events.service';
import { AssetsHistoryElrondNftsSwapEventsService } from './services/assets-history.nfts-swap-auction.service';
import { AssetsHistoryStakeEventsService } from './services/assets-history.stake.service';

@Module({
  providers: [
    AssetsHistoryService,
    AssetsHistoryResolver,
    AssetHistoryAccountResolver,
    AccountsProvider,
    AccountsRedisHandler,
    CommonModule,
    AssetsHistoryNftEventService,
    AssetsHistoryAuctionService,
    AssetsHistoryExternalAuctionService,
    AssetsHistoryElrondNftsSwapEventsService,
    AssetsHistoryStakeEventsService,
  ],
  imports: [forwardRef(() => ElrondCommunicationModule)],
})
export class AssetHistoryModuleGraph {}
