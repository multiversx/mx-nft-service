export declare class CachingConfig {
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
    verifyIdentity: CacheWithVerify;
    getProfile: number;
    networkConfig: number;
    networkStatus: number;
}
declare class CacheWithVerify {
    standard: number;
    verified: number;
}
export {};
