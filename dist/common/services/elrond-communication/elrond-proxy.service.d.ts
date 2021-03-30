import { ProxyProvider } from '@elrondnetwork/erdjs';
import { Logger } from 'winston';
import { CacheManagerService } from '../cache-manager/cache-manager.service';
import { QueryResponse } from '@elrondnetwork/erdjs/out/smartcontracts';
export declare class ElrondProxyService {
    private cacheManager;
    private readonly logger;
    private readonly proxy;
    constructor(cacheManager: CacheManagerService, logger: Logger);
    getService(): ProxyProvider;
    getAllContractAddresses(): Promise<QueryResponse>;
}
