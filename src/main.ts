import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import axios from 'axios';
import { AppModule } from './app.module';
import { PrivateAppModule } from './private.app.module';
import { TransactionsProcessorModule } from './transaction.processor.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  await app.listen(process.env.PORT);

  if (process.env.ENABLE_PRIVATE_API === 'true') {
    const privateApp = await NestFactory.create(PrivateAppModule);
    await privateApp.listen(
      parseInt(process.env.PRIVATE_PORT),
      process.env.PRIVATE_LISTEN_ADDRESS,
    );
  }

  if (process.env.ENABLE_TRANSACTION_PROCESSOR === 'true') {
    const privateTransactionsApp = await NestFactory.create(
      TransactionsProcessorModule,
    );
    await privateTransactionsApp.listen(
      parseInt(process.env.TRANSACTION_PROCESSOR_PORT),
      process.env.TRANSACTION_PROCESSOR_LISTEN_ADDRESS,
    );
  }

  console.log({ gatewayUrl: process.env.ELROND_GATEWAY });
}

bootstrap();

axios.interceptors.response.use(
  function (response) {
    let path = response?.request?.path;
    if (path && path.includes('by-nonce')) {
      let matches = path.match(
        /block\/(?<shard>[0-9]*)\/by-nonce\/(?<nonce>[0-9]*)/,
      );
      let shard = matches.groups['shard'];
      let nonce = matches.groups['nonce'];

      const result = response.data.data;

      let transactions = [];

      if (result && result.block && result.block.miniBlocks !== undefined) {
        for (let miniBlock of result.block.miniBlocks) {
          transactions.push(...miniBlock.transactions);
        }
      }

      console.log({
        shard,
        nonce,
        transactions: transactions.map((x) => x.hash),
      });
    }

    return response;
  },
  function (error) {
    return Promise.reject(error);
  },
);
