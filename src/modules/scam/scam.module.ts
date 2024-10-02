import { Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { PluginModule } from 'src/plugins/plugin.module';
import { AssetByIdentifierService } from '../assets';
import { AuthModule } from '../auth/auth.module';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { CollectionScamResolver } from './collection-scam.resolver';
import { CollectionScamService } from './collection-scam.service';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamResolver } from './nft-scam.resolver';
import { NftScamService } from './nft-scam.service';

@Module({
  imports: [CommonModule, DocumentDbModule, AuthModule, CacheEventsPublisherModule, PluginModule],
  providers: [
    Logger,
    NftScamService,
    NftScamElasticService,
    NftScamResolver,
    CollectionScamService,
    CollectionScamResolver,
    AssetByIdentifierService,
  ],
  exports: [NftScamService, NftScamElasticService, AssetByIdentifierService, CollectionScamService],
})
export class ScamModule { }
