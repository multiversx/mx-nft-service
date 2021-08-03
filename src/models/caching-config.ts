/**
 * Caching times expressed in seconds
 */
export class CachingConfig {
  auctionsRedisClientName: string;
  auctionsDbName: number;
  transactionsProcessorRedisClientName: string;
  transactionsProcessorDbName: number;
  auctionsttl: number;
  assetsDbName: number;
  assetsRedisClientName: string;
  assetsttl: number;
  ordersRedisClientName: string;
  ordersDbName: number;
  ordersttl: number;

  // network config and network status
  networkConfig: number;
  networkStatus: number;
}

class CacheWithVerify {
  standard: number;
  verified: number;
}
