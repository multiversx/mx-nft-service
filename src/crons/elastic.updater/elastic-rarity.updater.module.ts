import { Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { NftRarityModuleGraph } from 'src/modules/nft-rarity/nft-rarity.module';
import { ElasticRarityUpdaterService } from './elastic-rarity.updater.service';
import { RarityUpdaterService } from './rarity.updater.service';
import * as ormconfig from './../../ormconfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicModuleUtils } from 'src/utils/dynamicModule-utils';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    NftRarityModuleGraph,
    CachingModule,
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [Logger, ElasticRarityUpdaterService, RarityUpdaterService],
  exports: [ElasticRarityUpdaterService, RarityUpdaterService],
})
export class ElasticRarityUpdaterModule {}
