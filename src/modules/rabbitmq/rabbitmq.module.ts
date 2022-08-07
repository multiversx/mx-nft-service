import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { NftEventsModule } from './nft-events.module';

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
    };
  }
}
