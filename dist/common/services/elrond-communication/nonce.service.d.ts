import { RedisService } from 'nestjs-redis';
import { ElrondProxyService } from './elrond-proxy.service';
export declare class NonceService {
    private redisService;
    private elrondProxyService;
    private nonceTTL;
    constructor(redisService: RedisService, elrondProxyService: ElrondProxyService);
    getAccountWithNextAvailableNonce(address: string): Promise<import("@elrondnetwork/erdjs/out").AccountOnNetwork>;
}
