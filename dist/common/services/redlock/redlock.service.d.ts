import { RedisService } from 'nestjs-redis';
export declare type BooleanResponse = 1 | 0;
export declare class RedlockService {
    private redisService;
    private readonly redisClient;
    constructor(redisService: RedisService);
    lockTryOnce(resource: string, timeoutSeconds: number): Promise<BooleanResponse>;
    private expire;
}
