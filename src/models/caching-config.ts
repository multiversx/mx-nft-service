/**
 * Caching times expressed in seconds
 */
export class CachingConfig {
  getAllContractAddresses: number;
  getContractConfig: number;
  getBlsKeysStatus: number;
  getMetaData: CacheWithVerify;

  getUserUnBondable: number;
  getUserActiveStake: number;
  getClaimableRewards: number;
  getUserUnDelegatedList: number;

  getTotalActiveStake: number;
  getTotalUnStaked: number;
  getTotalCumulatedRewards: number;
  getNumUsers: number;
  getNumNodes: number;

  allProviders: number;

  // keybase
  verifyIdentity: CacheWithVerify;
  getProfile: number;

  // network config and network status
  networkConfig: number;
  networkStatus: number;
}

class CacheWithVerify {
  standard: number;
  verified: number;
}
