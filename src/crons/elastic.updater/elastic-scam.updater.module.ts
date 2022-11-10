import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common.module';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { NftScamModule } from 'src/modules/nft-scam/nft-scam.module';
import ormconfig from 'src/ormconfig';
import { ElasticScamUpdaterService } from './elastic-scam.service';
import { NftScamUpdaterService } from './nft-scam.updater.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    NftScamModule,
    DocumentDbModule,
  ],
  providers: [ElasticScamUpdaterService, NftScamUpdaterService],
  exports: [ElasticScamUpdaterService, NftScamUpdaterService],
})
export class ElasticNftScamUpdaterModule {}
