import { Global, Module } from '@nestjs/common';
import { rabbitExchanges } from '../../rabbit-config';
import { CommonRabbitModule } from '../common-rabbitmq.module';
import { CacheEventsPublisherService } from './change-events-publisher.service';

@Global()
@Module({
  imports: [
    CommonRabbitModule.register(() => {
      return {
        exchange: rabbitExchanges.CACHE_INVALIDATION,
        uri: process.env.COMMON_RABBITMQ_URL,
      };
    }),
  ],
  providers: [CacheEventsPublisherService],
  exports: [CacheEventsPublisherService],
})
export class CacheEventsPublisherModule {}
