/**
 * Caching times expressed in seconds
 */
export class CachingConfig {
  getAllContractAddresses: number;

  // network config and network status
  networkConfig: number;
  networkStatus: number;
}

class CacheWithVerify {
  standard: number;
  verified: number;
}
