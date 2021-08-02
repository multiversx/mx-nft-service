import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ElrondApiService } from 'src/common/services/elrond-communication/elrond-api.service';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { TransactionProcessor } from '@elrondnetwork/transaction-processor';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { oneWeek } from './helpers';
import { TransactionStatus } from './entities/transaction.status';
import { AuctionsService } from '../auctions/auctions.service';
import { AuctionStatusEnum } from '../auctions/models';
import { OrdersService } from '../orders/order.service';
import { CreateOrderArgs } from '../orders/models';

@Injectable()
export class TransactionService {
  private isRunnningHandleNewTransactions = false;
  private redisClient: Redis.Redis;

  constructor(
    private auctionsService: AuctionsService,
    private ordersService: OrdersService,
    private readonly redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.transactionsProcessorRedisClientName,
    );
  }

  @Cron('*/1 * * * * *')
  async handleNewTransactions() {
    if (this.isRunnningHandleNewTransactions) {
      return;
    }

    this.isRunnningHandleNewTransactions = true;
    try {
      let transactionProcessor = new TransactionProcessor();
      await transactionProcessor.start({
        gatewayUrl: process.env.ELROND_GATEWAY,
        onTransactionsReceived: async (shardId, nonce, transactions) => {
          this.processTransactions(transactions);
          console.log(
            `Received ${transactions.length} transnonceactions on shard ${shardId} and nonce ${nonce}`,
          );
        },
        getLastProcessedNonce: async (shardId) => {
          let result = await this.redisCacheService.get(
            this.redisClient,
            `lastprocessednonce:${shardId}`,
          );
          if (result === null) {
            return undefined;
          }

          return result;
        },
        setLastProcessedNonce: async (shardId, nonce) => {
          await this.redisCacheService.set(
            this.redisClient,
            `lastprocessednonce:${shardId}`,
            nonce,
            oneWeek(),
          );
        },
      });
    } finally {
      this.isRunnningHandleNewTransactions = false;
    }
  }

  private processTransactions(transactions) {
    transactions.forEach((transaction) => {
      const functionName = this.getDataFunctionName(transaction.data);
      const dataArgs = this.getDataArgs(transaction.data);
      if (transaction.status === TransactionStatus.success) {
        if (this.isAuctionToken(dataArgs)) {
          console.log('auctiontoken');
          // return;
        }
        switch (functionName) {
          case 'bid': {
            this.ordersService.createOrder(
              transaction.sender,
              new CreateOrderArgs({
                auctionId: parseInt(dataArgs[0], 16),
                priceToken: 'EGLD',
                priceAmount: transaction.value,
                priceNonce: 0,
              }),
            );
            return;
          }
          case 'withdraw': {
            this.auctionsService.updateAuction(
              parseInt(dataArgs[0], 16),
              AuctionStatusEnum.Closed,
            );
            // return;
          }
          case 'endAuction': {
            this.auctionsService.updateAuction(
              parseInt(dataArgs[0], 16),
              AuctionStatusEnum.Ended,
            );
            // return;
          }
          // default:
          //   return {};
        }
      }
    });
  }

  public getDataFunctionName(data): string | undefined {
    const decoded = this.getDataDecoded(data);
    if (decoded) {
      return decoded.split('@')[0];
    }

    return undefined;
  }

  public isAuctionToken(decoded): boolean | undefined {
    console.log('isAuctionToken', decoded);
    if (decoded && decoded.length > 4) {
      const dataEndpointName = Buffer.from(decoded[4], 'hex').toString();
      if (dataEndpointName === 'auctionToken') return true;
    }
    return false;
  }

  public getDataEndpointName(data): string | undefined {
    const decoded = this.getDataArgs(data);
    if (decoded && decoded.length > 2) {
      console.log(121, decoded);
      return Buffer.from(decoded[4], 'hex').toString();
    }
    return undefined;
  }
  public getDataArgs(data): string[] | undefined {
    const decoded = this.getDataDecoded(data);
    if (decoded) {
      return decoded.split('@').splice(1);
    }

    return undefined;
  }
  private getDataDecoded(data): string | undefined {
    if (data) {
      return base64Decode(data);
    }
    return undefined;
  }
}

export function base64DecodeBinary(str: string): Buffer {
  return Buffer.from(str, 'base64');
}

export function base64Decode(str: string): string {
  console.log('decodetr', str);
  return base64DecodeBinary(str).toString('binary');
}
