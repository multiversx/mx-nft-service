import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { CollectionsQueriesResolver } from './collection-queries.resolver';
import { CollectionsService } from './collection.service';
import { AssetsModuleGraph } from '../assets/assets.module';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { CollectionAssetsProvider } from './loaders/collection-assets.loader';
import { CollectionAssetsRedisHandler } from './loaders/collection-assets.redis-handler';
import { CollectionAssetsCountProvider } from './loaders/collection-assets-count.loader';
import { CollectionAssetsCountRedisHandler } from './loaders/collection-assets-count.redis-handler';
import { CollectionAssetsResolver } from './collection-assets.resolver';
import { CollectionsMutationsResolver } from './collection-mutations.resolver';
import { CacheService } from 'src/common/services/caching/cache.service';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';
import { CollectionsNftsRedisHandler } from './collection-nfts.redis-handler';
import { CollectionsNftsCountRedisHandler } from './collection-nfts-count.redis-handler';

@Module({
  providers: [
    CollectionsService,
    CollectionAssetsResolver,
    CollectionAssetsProvider,
    CollectionAssetsRedisHandler,
    CollectionAssetsCountProvider,
    CollectionAssetsCountRedisHandler,
    CollectionsQueriesResolver,
    CollectionsMutationsResolver,
    AccountsRedisHandler,
    AccountsProvider,
    CacheService,
    LocalCacheService,
    CollectionsNftsRedisHandler,
    CollectionsNftsCountRedisHandler,
  ],
  imports: [ElrondCommunicationModule, AssetsModuleGraph],
  exports: [CollectionsService, LocalCacheService],
})
export class CollectionModuleGraph {}
