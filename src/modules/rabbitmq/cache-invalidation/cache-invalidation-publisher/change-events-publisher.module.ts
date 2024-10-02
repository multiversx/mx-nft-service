import { Global, Module } from '@nestjs/common';
import { rabbitExchanges } from '../../rabbit-config';
import { CommonRabbitModule } from '../common-rabbitmq.module';
import { CacheEventsPublisherService, NftLikePublisherService } from './change-events-publisher.service';

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
  providers: [CacheEventsPublisherService, NftLikePublisherService],
  exports: [CacheEventsPublisherService, NftLikePublisherService],
})
export class CacheEventsPublisherModule { }
