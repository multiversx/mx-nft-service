/**
 * Caching times expressed in seconds
 */
export class CachingConfig {
  auctionsRedisClientName: string;
  auctionsDbName: number;
  auctionsttl: number;
  assetsDbName: number;
  assetsRedisClientName: string;
  assetsttl: number;
  ordersRedisClientName: string;
  ordersDbName: number;
  ordersttl: number;
  followersDbName: number;
  followersRedisClientName: string;
  followersttl: number;

  // network config and network status
  networkConfig: number;
  networkStatus: number;
}
