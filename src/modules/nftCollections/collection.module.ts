import { forwardRef, Module } from '@nestjs/common';
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
import { CachingService } from 'src/common/services/caching/caching.service';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';
import { CollectionsNftsRedisHandler } from './collection-nfts.redis-handler';
import { CollectionsNftsCountRedisHandler } from './collection-nfts-count.redis-handler';
import { ElrondCommunicationModule } from 'src/common/services/elrond-communication/elrond-communication.module';
import { OnSaleAssetsCountForCollectionProvider } from './loaders/onsale-assets-count.loader';
import { OnSaleAssetsCountForCollectionRedisHandler } from './loaders/onsale-assets-count.redis-handler';
import { ArtistAddressProvider } from '../artists/artists.loader';
import { AssetsCollectionRedisHandler } from '../assets/loaders/assets-collection.redis-handler';
import { AssetsCollectionsProvider } from '../assets/loaders/assets-collection.loader';
import { ArtistAddressRedisHandler } from '../artists/artists.redis-handler';

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
    OnSaleAssetsCountForCollectionProvider,
    OnSaleAssetsCountForCollectionRedisHandler,
    CachingService,
    LocalCacheService,
    CollectionsNftsRedisHandler,
    CollectionsNftsCountRedisHandler,
    ArtistAddressProvider,
    ArtistAddressRedisHandler,
    AssetsCollectionsProvider,
    AssetsCollectionRedisHandler,
  ],
  imports: [
    forwardRef(() => ElrondCommunicationModule),
    forwardRef(() => AssetsModuleGraph),
  ],
  exports: [CollectionsService, LocalCacheService],
})
export class CollectionModuleGraph {}
