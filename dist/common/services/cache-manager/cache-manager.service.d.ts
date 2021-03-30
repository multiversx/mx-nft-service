import { Cache } from 'cache-manager';
import { NetworkStatus } from '@elrondnetwork/erdjs/out/networkStatus';
export declare class CacheManagerService {
    protected readonly cacheManager: Cache;
    constructor(cacheManager: Cache);
    setAllContractAddresses(addresses: Record<string, any>): Promise<void>;
    getAllContractAddresses(): Promise<Record<string, any>>;
    getNetworkStatus(): Promise<NetworkStatus>;
    private set;
}
