import { Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CacheModule } from 'src/common/services/caching/caching.module';
import { NftTraitsModule } from 'src/modules/nft-traits/nft-traits.module';
import { TraitsUpdaterService } from './traits.updater.service';
import { ElasticTraitsUpdaterService } from './elastic-traits.updater.service';

@Module({
  imports: [CommonModule, NftTraitsModule, CacheModule],
  providers: [Logger, ElasticTraitsUpdaterService, TraitsUpdaterService],
  exports: [ElasticTraitsUpdaterService, TraitsUpdaterService],
})
export class ElasticTraitsUpdaterModule {}
