import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { NftScamModule } from 'src/modules/nft-scam/nft-scam.module';
import ormconfig from 'src/ormconfig';
import { ElasticScamUpdaterService } from './elastic-scam.service';
import { NftScamUpdaterService } from './nft-scam.updater.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    NftScamModule,
    PersistenceModule,
  ],
  providers: [ElasticScamUpdaterService, NftScamUpdaterService],
  exports: [ElasticScamUpdaterService, NftScamUpdaterService],
})
export class ElasticNftScamUpdaterModule {}
