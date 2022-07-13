/**
 * Caching times expressed in seconds
 */
export class CachingConfig {
  auctionsRedisClientName: string;
  auctionsDbName: number;
  assetsRedisClientName: string;
  assetsDbName: number;
  ordersRedisClientName: string;
  ordersDbName: number;
  persistentDbName: number;
  persistentRedisClientName: string;
  collectionsDbName: number;
  collectionsRedisClientName: string;
  rarityQueueClientName: string;
  rarityQueueDbName: number;

  // network config and network status
  networkConfig: number;
  networkStatus: number;
}
