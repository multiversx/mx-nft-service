import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import BigNumber from 'bignumber.js';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { AppModule } from './app.module';
import { ports } from './config';
import { CacheWarmerModule } from './crons/cache.warmer/cache.warmer.module';
import { ClaimableModule } from './crons/claimable/claimable.auction.module';
import { ElasticNsfwUpdaterModule } from './crons/elastic.updater/elastic-nsfw.updater.module';
import { ElasticRarityUpdaterModule } from './crons/elastic.updater/elastic-rarity.updater.module';
import { ElasticNftScamUpdaterModule } from './crons/elastic.updater/elastic-scam.updater.module';
import { ElasticTraitsUpdaterModule } from './crons/elastic.updater/elastic-traits.updater.module';
import { ApiConfigModule } from './modules/common/api-config/api.config.module';
import { ApiConfigService } from './modules/common/api-config/api.config.service';
import { LoggingInterceptor } from './modules/metrics/logging.interceptor';
import { CacheEventsModule } from './modules/rabbitmq/cache-invalidation/cache-events.module';
import { PrivateAppModule } from './private.app.module';
import { PubSubListenerModule } from './pubsub/pub.sub.listener.module';
import { RabbitMqProcessorModule } from './rabbitmq.processor.module';
import { LoggerService } from './utils/LoggerService';

async function bootstrap() {
  BigNumber.config({ EXPONENTIAL_AT: [-100, 100] });

  const apiConfigApp = await NestFactory.create(ApiConfigModule);
  const apiConfigService = apiConfigApp.get<ApiConfigService>(ApiConfigService);
  if (process.env.ENABLE_PUBLIC_API === 'true') {
    await startPublicApp();
  }

  const logger = new LoggerService();

  if (process.env.ENABLE_RABBITMQ === 'true') {
    const rabbitMq = await NestFactory.create(RabbitMqProcessorModule);
    rabbitMq.useLogger(logger);
    await rabbitMq.listen(6014);
  }

  if (process.env.ENABLE_PRIVATE_API === 'true') {
    const privateApp = await NestFactory.create(PrivateAppModule);
    await privateApp.listen(parseInt(process.env.PRIVATE_PORT), process.env.PRIVATE_LISTEN_ADDRESS);
  }

  if (process.env.ENABLE_CACHE_INVALIDATION === 'true') {
    const cacheEvents = await NestFactory.createMicroservice(CacheEventsModule);
    cacheEvents.useLogger(logger);
    await cacheEvents.listen();
  }

  if (process.env.ENABLE_CLAIMABLE_AUCTIONS === 'true') {
    let processorApp = await NestFactory.createMicroservice(ClaimableModule);
    await processorApp.listen();
  }

  if (process.env.ENABLE_CACHE_WARMER === 'true') {
    let processorApp = await NestFactory.create(CacheWarmerModule);
    await processorApp.listen(process.env.CACHE_PORT);
  }

  if (process.env.ENABLE_NSFW_CRONJOBS === 'true') {
    let processorApp = await NestFactory.create(ElasticNsfwUpdaterModule);
    processorApp.useLogger(logger);
    await processorApp.listen(process.env.NSFW_PORT);
  }

  if (process.env.ENABLE_RARITY_CRONJOBS === 'true') {
    let processorApp = await NestFactory.create(ElasticRarityUpdaterModule);
    processorApp.useLogger(logger);
    await processorApp.listen(ports.rarity);
  }

  if (process.env.ENABLE_TRAITS_CRONJOBS === 'true') {
    let processorApp = await NestFactory.create(ElasticTraitsUpdaterModule);
    processorApp.useLogger(logger);
    await processorApp.listen(ports.traits);
  }

  if (process.env.ENABLE_SCAM_CRONJOBS === 'true') {
    let processorApp = await NestFactory.create(ElasticNftScamUpdaterModule);
    processorApp.useLogger(logger);
    await processorApp.listen(ports.scamInfo);
  }
  if (process.env.ENABLE_CACHE_INVALIDATION !== 'true') {
    const pubSubApp = await NestFactory.createMicroservice<MicroserviceOptions>(PubSubListenerModule, {
      transport: Transport.REDIS,
      options: {
        host: apiConfigService.getRedisUrl(),
        port: apiConfigService.getRedisPort(),
        retryAttempts: 100,
        retryDelay: 1000,
        retryStrategy: () => 1000,
      },
    });
    pubSubApp.listen();
  }

  logger.log(`Public API active: ${process.env.ENABLE_PUBLIC_API}`);
  logger.log(`Private API active: ${process.env.ENABLE_PRIVATE_API}`);
  logger.log(`Claimable job is active: ${process.env.ENABLE_CLAIMABLE_AUCTIONS}`);
  logger.log(`Cache warmer active: ${process.env.ENABLE_CACHE_WARMER}`);
  logger.log(`Rabbit is active: ${process.env.ENABLE_RABBITMQ}`);
  logger.log(`Cache invalidation is active: ${process.env.ENABLE_CACHE_INVALIDATION}`);
  logger.log(`Account batch get is active: ${process.env.ENABLE_BATCH_ACCOUNT_GET}`);
  logger.log(`NSFW cron job is active: ${process.env.ENABLE_NSFW_CRONJOBS}`);
  logger.log(`Elastic updates are active: ${process.env.ENABLE_ELASTIC_UPDATES}`);
  logger.log(`Elastic nft traits are active: ${process.env.ENABLE_TRAITS_CRONJOBS}`);
  logger.log(`Elastic nft rarities are active: ${process.env.ENABLE_RARITY_CRONJOBS}`);
  logger.log(`Elastic nft scams are active: ${process.env.ENABLE_SCAM_CRONJOBS}`);
  logger.log(`Marketplace events indexing is active: ${process.env.ENABLE_MARKETPLACE_EVENTS}`);
  logger.log(`Trending by volume is active: ${process.env.ENABLE_TRENDING_BY_VOLUME}`);
}

bootstrap();

async function startPublicApp() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });
  app.enableCors();
  app.use(graphqlUploadExpress());

  const httpAdapterHostService = app.get<HttpAdapterHost>(HttpAdapterHost);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidUnknownValues: false,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  const httpServer = httpAdapterHostService.httpAdapter.getHttpServer();
  httpServer.keepAliveTimeout = parseInt(process.env.KEEPALIVE_TIMEOUT_UPSTREAM);

  await app.listen(process.env.PORT);
}
