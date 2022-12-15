import { Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CachingModule } from 'src/common/services/caching/caching.module';
import * as ormconfig from './../../ormconfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftTraitsModule } from 'src/modules/nft-traits/nft-traits.module';
import { TraitsUpdaterService } from './traits.updater.service';
import { ElasticTraitsUpdaterService } from './elastic-traits.updater.service';
import { DynamicModuleUtils } from 'src/utils/dynamicModule-utils';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    NftTraitsModule,
    CachingModule,
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [Logger, ElasticTraitsUpdaterService, TraitsUpdaterService],
  exports: [ElasticTraitsUpdaterService, TraitsUpdaterService],
})
export class ElasticTraitsUpdaterModule {}
