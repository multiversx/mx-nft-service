import { forwardRef, Module } from '@nestjs/common';
import { AssetsHistoryResolver, AssetsHistoryService } from '.';
import { MxCommunicationModule } from 'src/common';
import { AssetHistoryAccountResolver } from './asset-history-account-resolver';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { CommonModule } from 'src/common.module';
import { AssetsHistoryAuctionService } from './services/assets-history.auction.service';
import { AssetsHistoryExternalAuctionService } from './services/assets-history.external-auction.service';
import { AssetsHistoryNftEventService } from './services/assets-history.nft-events.service';
import { AssetsHistoryElrondNftsSwapEventsService } from './services/assets-history.nfts-swap-auction.service';
import { AssetsHistoryCachingService } from './assets-history-caching.service';
import { AssetsHistoryElasticService } from './assets-history-elastic.service';

@Module({
  providers: [
    AssetsHistoryService,
    AssetsHistoryResolver,
    AssetHistoryAccountResolver,
    AccountsProvider,
    AccountsRedisHandler,
    AssetsHistoryNftEventService,
    AssetsHistoryAuctionService,
    AssetsHistoryExternalAuctionService,
    AssetsHistoryElrondNftsSwapEventsService,
    AssetsHistoryCachingService,
    AssetsHistoryElasticService,
  ],
  imports: [forwardRef(() => MxCommunicationModule)],
})
export class AssetHistoryModuleGraph {}
