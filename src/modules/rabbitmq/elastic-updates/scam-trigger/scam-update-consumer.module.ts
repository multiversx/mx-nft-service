import { forwardRef, Global, Module } from '@nestjs/common';
import { rabbitExchanges } from '../../rabbit-config';
import { CommonRabbitModule } from '../../cache-invalidation/common-rabbitmq.module';
import { ScamUpdateEventsConsumer } from './scam-update-events.consumer';
import { ScamModule } from 'src/modules/scam/scam.module';

@Global()
@Module({
  imports: [
    CommonRabbitModule.register(() => {
      return {
        exchange: rabbitExchanges.SCAM_UPDATE,
        uri: process.env.COMMON_RABBITMQ_URL,
      };
    }),
    forwardRef(() => ScamModule)
  ],
  providers: [ScamUpdateEventsConsumer],
  exports: [ScamUpdateEventsConsumer],
})
export class ScamUpdateConsumerModule { }
