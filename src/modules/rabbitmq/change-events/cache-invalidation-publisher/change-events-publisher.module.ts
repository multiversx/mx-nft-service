import { Module } from '@nestjs/common';
import { CommonRabbitModule } from '../common-rabbitmq.module';
import { CacheEventsPublisherService } from './change-events-publisher.service';

@Module({
  imports: [
    CommonRabbitModule.register(() => {
      return {
        exchange: 'cache-events',
        uri: process.env.COMMON_RABBITMQ_URL,
      };
    }),
  ],
  providers: [CacheEventsPublisherService],
  exports: [CacheEventsPublisherService],
})
export class CacheEventsPublisherModule {}
