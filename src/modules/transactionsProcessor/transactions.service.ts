import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import {
  LogTopic,
  TransactionProcessor,
} from '@elrondnetwork/transaction-processor';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { oneWeek } from './helpers';
import { AuctionsService } from '../auctions/auctions.service';
import { AuctionStatusEnum } from '../auctions/models';
import { OrdersService } from '../orders/order.service';
import { CreateOrderArgs } from '../orders/models';
import { ElrondProxyService } from 'src/common';
import { getDataArgs, getDataFunctionName } from './decoders';
import { ElrondApiService } from 'src/common/services/elrond-communication/elrond-api.service';

@Injectable()
export class TransactionService {
  private isRunnningHandleNewTransactions = false;
  private redisClient: Redis.Redis;
  private transactionProcessor = new TransactionProcessor();

  constructor(
    private auctionsService: AuctionsService,
    private gatewayService: ElrondProxyService,
    private apiService: ElrondApiService,
    private ordersService: OrdersService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.transactionsProcessorRedisClientName,
    );
  }

  @Cron(CronExpression.EVERY_SECOND)
  async handleNewTransactions() {
    if (this.isRunnningHandleNewTransactions) {
      return;
    }

    this.isRunnningHandleNewTransactions = true;
    try {
      await this.transactionProcessor.start({
        gatewayUrl: process.env.ELROND_GATEWAY,
        waitForFinalizedCrossShardSmartContractResults: true,
        onTransactionsReceived: async (shardId, nonce, transactions) => {
          this.processTransactions(transactions);
          console.log(
            `Received ${transactions.length} transactions on shard ${shardId} and nonce ${nonce}`,
          );
        },
        getLastProcessedNonce: async (shardId) => {
          return await this.redisCacheService.get(
            this.redisClient,
            `lastprocessednonce:${shardId}`,
          );
        },
        setLastProcessedNonce: async (shardId, nonce) => {
          await this.redisCacheService.set(
            this.redisClient,
            `lastprocessednonce:${shardId}`,
            nonce,
            oneWeek(),
          );
        },
        onMessageLogged: (topic: LogTopic, message: string) => {
          console.log(`TxProcessor: ${message}`);
        },
      });
    } finally {
      this.isRunnningHandleNewTransactions = false;
    }
  }

  private processTransactions(transactions) {
    transactions.forEach(async (transaction) => {
      const functionName = getDataFunctionName(transaction.data);
      const dataArgs = getDataArgs(transaction.data);

      if (
        this.isAuctionToken(dataArgs) &&
        (await this.isTransactionSuccessful(transaction))
      ) {
        const trans = await this.gatewayService
          .getService()
          .getTransaction(transaction.hash, undefined, true);
        const scResults = trans.getSmartContractResults().getResultingCalls();
        if (scResults.length > 0) {
          const decodedData = this.splitDataArgs(
            scResults[scResults.length - 1]?.data,
          );

          if (Buffer.from(decodedData[0], 'hex').toString() === 'ok') {
            this.auctionsService.saveAuction(
              parseInt(decodedData[1], 16),
              Buffer.from(dataArgs[0], 'hex').toString(),
              dataArgs[1],
            );
          }
        }
      }
      switch (functionName) {
        case 'bid': {
          if (await this.isTransactionSuccessful(transaction))
            this.ordersService.createOrder(
              new CreateOrderArgs({
                ownerAddress: transaction.sender,
                auctionId: parseInt(dataArgs[0], 16),
                priceToken: 'EGLD',
                priceAmount: transaction.value,
                priceNonce: 0,
              }),
            );
          return;
        }
        case 'buySft': {
          if (await this.isTransactionSuccessful(transaction))
            this.ordersService.createOrderForSft(
              new CreateOrderArgs({
                ownerAddress: transaction.sender,
                auctionId: parseInt(dataArgs[0], 16),
                priceToken: 'EGLD',
                priceAmount: transaction.value,
                priceNonce: 0,
              }),
            );
          return;
        }

        case 'withdraw': {
          if (await this.isTransactionSuccessful(transaction)) {
            this.auctionsService.updateAuction(
              parseInt(dataArgs[0], 16),
              AuctionStatusEnum.Closed,
            );
            return;
          }
        }
        case 'endAuction': {
          if (await this.isTransactionSuccessful(transaction)) {
            this.auctionsService.updateAuction(
              parseInt(dataArgs[0], 16),
              AuctionStatusEnum.Ended,
            );
            return;
          }
        }
        default:
          return {};
      }
    });
  }

  private async isTransactionSuccessful(transaction: any) {
    return (
      (
        await this.apiService.getService().getTransaction(transaction.hash)
      ).status.status
        .valueOf()
        .toLowerCase() === 'success'
    );
  }

  public splitDataArgs(data): string[] | undefined {
    return data.split('@').splice(1);
  }

  public isAuctionToken(decoded): boolean | undefined {
    if (decoded && decoded.length > 4) {
      const dataEndpointName = Buffer.from(decoded[4], 'hex').toString();
      if (dataEndpointName === 'auctionToken') return true;
    }
    return false;
  }
}
