import { Global, Module } from '@nestjs/common';
import { TraitRepositoryService } from 'src/document-db/repositories/traits.repository';
import {
  CollectionTraitSummary,
  CollectionTraitSummarySchema,
} from 'src/modules/nft-traits/models/collection-traits.model';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common.module';
import { ApiConfigService } from 'src/utils/api.config.service';

import {
  ScamInfoModel,
  ScamInfoSchema,
} from 'src/modules/scam/models/scam-info.model';
import { NftScamInfoRepositoryService } from 'src/document-db/repositories/nft-scam.repository';
import { DocumentDbService } from './document-db.service';

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
        name: ScamInfoModel.name,
        schema: ScamInfoSchema,
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
