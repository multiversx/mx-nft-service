import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { RabbitModuleConfig } from '../rabbit-config';
import { RabbitPublisherService } from '../rabbit.publisher';

@Module({})
export class CommonRabbitModule {
  static register(config: () => RabbitModuleConfig): DynamicModule {
    return {
      module: CommonRabbitModule,
      imports: [
        CommonModule,
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          useFactory: () => {
            const { uri, exchange } = config();
            return {
              name: 'common',
              uri: uri,
              connectionInitOptions: {
                timeout: 10000,
              },
              exchanges: [
                {
                  name: exchange,
                  type: 'fanout',
                  options: {},
                },
              ],
            };
          },
        }),
      ],
      providers: [RabbitPublisherService],
      exports: [RabbitPublisherService],
    };
  }
}
