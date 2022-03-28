import { Logger, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import BigNumber from 'bignumber.js';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CacheWarmerModule } from './crons/cache.warmer/cache.warmer.module';
import { ClaimableAuctionsModule } from './crons/claimable.auctions/claimable.auction.module';
import { LoggingInterceptor } from './modules/metrics/logging.interceptor';
// import { Logger } from '@nestjs/common';
import { PrivateAppModule } from './private.app.module';
import { PubSubListenerModule } from './pubsub/pub.sub.listener.module';
import { RabbitMqProcessorModule } from './rabbitmq.processor.module';

async function bootstrap() {
  BigNumber.config({ EXPONENTIAL_AT: [-30, 30] });
  const app = await NestFactory.create(AppModule);
  const httpAdapterHostService = app.get<HttpAdapterHost>(HttpAdapterHost);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  const httpServer = httpAdapterHostService.httpAdapter.getHttpServer();
  httpServer.keepAliveTimeout = parseInt(
    process.env.KEEPALIVE_TIMEOUT_UPSTREAM,
  );

  await app.listen(process.env.PORT);

  if (process.env.ENABLE_PRIVATE_API === 'true') {
    const privateApp = await NestFactory.create(PrivateAppModule);
    await privateApp.listen(
      parseInt(process.env.PRIVATE_PORT),
      process.env.PRIVATE_LISTEN_ADDRESS,
    );
  }

  if (process.env.ENABLE_RABBITMQ === 'true') {
    const rabbitMq = await NestFactory.create(RabbitMqProcessorModule);
    await rabbitMq.listen(5673, '0.0.0.0');
  }

  if (process.env.ENABLE_CLAIMABLE_AUCTIONS === 'true') {
    let processorApp = await NestFactory.create(ClaimableAuctionsModule);
    await processorApp.listen(6011);
  }

  if (process.env.ENABLE_CACHE_WARMER === 'true') {
    let processorApp = await NestFactory.create(CacheWarmerModule);
    await processorApp.listen(6012);
  }

  const logger = new Logger('Bootstrapper');

  const pubSubApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    PubSubListenerModule,
    {
      transport: Transport.REDIS,
      options: {
        url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}`,
        retryAttempts: 100,
        retryDelay: 1000,
        retry_strategy: function (_: any) {
          return 1000;
        },
      },
    },
  );

  pubSubApp.listen();

  logger.log(`Private API active: ${process.env.ENABLE_PRIVATE_API}`);
  logger.log(
    `Claimable job is active: ${process.env.ENABLE_CLAIMABLE_AUCTIONS}`,
  );
  logger.log(`Cache warmer active: ${process.env.ENABLE_CACHE_WARMER}`);
  logger.log(`Rabbit is active: ${process.env.ENABLE_RABBITMQ}`);
}

bootstrap();
