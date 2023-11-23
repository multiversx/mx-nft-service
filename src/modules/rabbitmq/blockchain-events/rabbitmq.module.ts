import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module, forwardRef } from '@nestjs/common';
import { NftEventsModule } from './nft-events.module';
import { RabbitPublisherService } from '../rabbit.publisher';
import { DisabledMarketplaceEventsService } from '../disable-marketplace-events.service';
import { MarketplaceDisablePublisherService } from '../disable-marketplace-publisher.service';

@Module({})
export class RabbitMqModule {
  static register(): DynamicModule {
    return {
      module: RabbitMqModule,
      imports: [
        NftEventsModule,
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          useFactory: () => {
            return {
              name: 'default',
              uri: process.env.RABBITMQ_URL,
              exchanges: [
                {
                  name: process.env.RABBITMQ_EXCHANGE,
                  type: 'fanout',
                  options: {},
                },
              ],
              connectionInitOptions: {
                timeout: 10000,
              },
            };
          },
        }),
      ],
      providers: [RabbitPublisherService, DisabledMarketplaceEventsService, MarketplaceDisablePublisherService],
      exports: [RabbitPublisherService, DisabledMarketplaceEventsService, MarketplaceDisablePublisherService],
    };
  }
}
