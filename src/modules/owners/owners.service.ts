import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { cacheConfig } from 'src/config';
import { Owner } from './models';

@Injectable()
export class OwnersService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private apiService: ElrondApiService,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getOwnersForIdentifier(
    identifier: string,
    offset: number,
    limit: number,
  ): Promise<[Owner[], number]> {
    const [nfts, count] = await Promise.all([
      this.apiService.getOwnersForIdentifier(identifier, offset, limit),
      this.apiService.getOwnersForIdentifierCount(identifier),
    ]);
    const assets = nfts.map((element) =>
      Owner.fromApiOwner(element, identifier),
    );
    return [assets, count];
  }
}
