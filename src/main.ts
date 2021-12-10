import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClaimableAuctionsModule } from './crons/claimable.auction.module';
import { LoggingInterceptor } from './modules/metrics/logging.interceptor';
import { PrivateAppModule } from './private.app.module';
import { RabbitMqProcessorModule } from './rabbitmq.processor.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  process.on('warning', (e) => console.warn(e.stack));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());
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
}

bootstrap();
