import { forwardRef, Module } from '@nestjs/common';
import { CollectionsQueriesResolver } from './collections-queries.resolver';
import { CollectionsTransactionsService } from './collections-transactions.service';
import { AssetsModuleGraph } from '../assets/assets.module';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { CollectionAssetsProvider } from './loaders/collection-assets.loader';
import { CollectionAssetsRedisHandler } from './loaders/collection-assets.redis-handler';
import { CollectionAssetsCountProvider } from './loaders/collection-assets-count.loader';
import { CollectionAssetsCountRedisHandler } from './loaders/collection-assets-count.redis-handler';
import { CollectionAssetsResolver } from './collection-assets.resolver';
import { CollectionsMutationsResolver } from './collections-mutations.resolver';
import { CachingService } from 'src/common/services/caching/caching.service';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';
import { CollectionsNftsRedisHandler } from './collection-nfts.redis-handler';
import { CollectionsNftsCountRedisHandler } from './collection-nfts-count.redis-handler';
import { MxCommunicationModule } from 'src/common/services/mx-communication/mx-communication.module';
import { OnSaleAssetsCountForCollectionProvider } from './loaders/onsale-assets-count.loader';
import { OnSaleAssetsCountForCollectionRedisHandler } from './loaders/onsale-assets-count.redis-handler';
import { ArtistAddressProvider } from '../artists/artists.loader';
import { AssetsCollectionsRedisHandler } from '../assets/loaders/assets-collection.redis-handler';
import { AssetsCollectionsProvider } from '../assets/loaders/assets-collection.loader';
import { ArtistAddressRedisHandler } from '../artists/artists.redis-handler';
import { SmartContractArtistsService } from '../artists/smart-contract-artist.service';
import { CollectionsGetterService } from './collections-getter.service';
import { AssetsCollectionsForOwnerProvider } from '../assets/loaders/assets-collection-for-owner.loader';
import { AssetsCollectionsForOwnerRedisHandler } from '../assets/loaders/assets-collection-for-owner.redis-handler';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { CommonModule } from 'src/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [
    CollectionsTransactionsService,
    CollectionsGetterService,
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
    AssetsCollectionsRedisHandler,
    AssetsCollectionsForOwnerProvider,
    AssetsCollectionsForOwnerRedisHandler,
    SmartContractArtistsService,
  ],
  imports: [
    forwardRef(() => MxCommunicationModule),
    forwardRef(() => AssetsModuleGraph),
    forwardRef(() => CommonModule),
    forwardRef(() => AuthModule),
    DocumentDbModule,
  ],
  exports: [
    CollectionsTransactionsService,
    CollectionsGetterService,
    LocalCacheService,
  ],
})
export class CollectionsModuleGraph {}
