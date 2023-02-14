import { forwardRef, Module } from '@nestjs/common';
import { CacheModule } from 'src/common/services/caching/caching.module';
import { ApiConfigModule } from 'src/modules/common/api-config/api.config.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { PubSubListenerController } from './pub.sub.listener.controller';

@Module({
  imports: [forwardRef(() => CacheModule), ApiConfigModule],
  controllers: [PubSubListenerController],
  providers: [DynamicModuleUtils.getPubSubService()],
  exports: ['PUBSUB_SERVICE'],
})
export class PubSubListenerModule {}
