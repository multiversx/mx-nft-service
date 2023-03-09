import { Global, Module } from '@nestjs/common';
import { TraitRepositoryService } from 'src/document-db/repositories/traits.repository';
import {
  CollectionTraitSummary,
  CollectionTraitSummarySchema,
} from 'src/modules/nft-traits/models/collection-traits.model';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common.module';

import {
  NftScamInfoModel,
  NftScamInfoSchema,
} from 'src/modules/scam/models/nft-scam-info.model';
import { NftScamInfoRepositoryService } from 'src/document-db/repositories/nft-scam.repository';
import { DocumentDbService } from './document-db.service';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [CommonModule],
      useFactory: async (configService: ApiConfigService) => ({
        uri: `${configService.getMongoDbUrl()}`,
        dbName: configService.getMongoDbName(),
        user: configService.getMongoDbUsername(),
        pass: configService.getMongoDbPassword(),
        tlsAllowInvalidCertificates: true,
      }),
      inject: [ApiConfigService],
    }),
    MongooseModule.forFeature([
      {
        name: CollectionTraitSummary.name,
        schema: CollectionTraitSummarySchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: NftScamInfoModel.name,
        schema: NftScamInfoSchema,
      },
    ]),
  ],
  providers: [
    DocumentDbService,
    TraitRepositoryService,
    NftScamInfoRepositoryService,
  ],
  exports: [DocumentDbService],
})
export class DocumentDbModule {}
