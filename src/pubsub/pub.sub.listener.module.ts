import { forwardRef, Module } from '@nestjs/common';
import {
  ClientOptions,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { PubSubListenerController } from './pub.sub.listener.controller';

@Module({
  imports: [forwardRef(() => CachingModule)],
  controllers: [PubSubListenerController],
  providers: [
    {
      provide: 'PUBSUB_SERVICE',
      useFactory: () => {
        const clientOptions: ClientOptions = {
          transport: Transport.REDIS,
          options: {
            url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}`,
            retryDelay: 1000,
            retryAttempts: 10,
            retry_strategy: function (_: any) {
              return 1000;
            },
          },
        };

        return ClientProxyFactory.create(clientOptions);
      },
    },
  ],
  exports: ['PUBSUB_SERVICE'],
})
export class PubSubListenerModule {}
