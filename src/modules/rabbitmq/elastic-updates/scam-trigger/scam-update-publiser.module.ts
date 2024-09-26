import { Global, Module } from '@nestjs/common';
import { rabbitExchanges } from '../../rabbit-config';
import { CommonRabbitModule } from '../../cache-invalidation/common-rabbitmq.module';
import { ScamUpdatePublisherService } from './scam-update-publiser.service';

@Global()
@Module({
  imports: [
    CommonRabbitModule.register(() => {
      return {
        exchange: rabbitExchanges.SCAM_UPDATE,
        uri: process.env.COMMON_RABBITMQ_URL,
      };
    }),
  ],
  providers: [ScamUpdatePublisherService],
  exports: [ScamUpdatePublisherService],
})
export class ScamUpdatePublisherModule { }
