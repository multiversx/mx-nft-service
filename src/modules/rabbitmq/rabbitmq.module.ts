import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { NftTransactionsModule } from './nft-transactions.module';

@Module({
  imports: [NftTransactionsModule],
})
export class RabbitMqModule {
  static register(): DynamicModule {
    return {
      module: RabbitMqModule,
      imports: [
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          useFactory: () => {
            return {
              name: process.env.RABBITMQ_EXCHANGE,
              type: 'fanout',
              options: {},
              uri: process.env.RABBITMQ_URL,
            };
          },
        }),
      ],
    };
  }
}
