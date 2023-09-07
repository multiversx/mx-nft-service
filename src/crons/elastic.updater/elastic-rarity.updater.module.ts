import { Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { NftRarityModuleGraph } from 'src/modules/nft-rarity/nft-rarity.module';
import { ElasticRarityUpdaterService } from './elastic-rarity.updater.service';
import { RarityUpdaterService } from './rarity.updater.service';
import * as ormconfig from './../../ormconfig';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }), CommonModule, NftRarityModuleGraph],
  providers: [Logger, ElasticRarityUpdaterService, RarityUpdaterService],
  exports: [ElasticRarityUpdaterService, RarityUpdaterService],
})
export class ElasticRarityUpdaterModule {}
