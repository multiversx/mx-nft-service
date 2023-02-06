// import { RedisCacheService } from '@multiversx/sdk-nestjs';
// import { Inject, Injectable, Logger } from '@nestjs/common';
// import { isNil } from '@nestjs/common/utils/shared.utils';
// import Redis from 'ioredis';
// export const REDIS_CLIENT_TOKEN = 'REDIS_CLIENT_TOKEN';
// @Injectable()
// export class LocalRedisCacheService {
//   constructor(
//     private readonly logger: Logger,
//     private readonly redisCacheService: RedisCacheService,
//     @Inject('REDIS_CLIENT_TOKEN') private readonly redis: Redis,
//   ) {}

//   async getOrSetWithDifferentTtl(
//     key: string,
//     createValueFunc: () => any,
//   ): Promise<any> {
//     const cachedData = await this.redisCacheService.get(key);
//     if (!isNil(cachedData)) {
//       return cachedData;
//     }
//     const value = await this.buildInternalCreateValueFunc(key, createValueFunc);
//     await this.redisCacheService.set(key, value, value.ttl);

//     return value;
//   }

//   private async buildInternalCreateValueFunc(
//     key: string,
//     createValueFunc: () => any,
//   ): Promise<any> {
//     try {
//       let data = createValueFunc();
//       if (data instanceof Promise) {
//         data = await data;
//       }
//       return data;
//     } catch (err) {
//       this.logger.error(`An error occurred while trying to load value.`, {
//         path: 'redis-cache.service.createValueFunc',
//         exception: err,
//         key,
//       });
//       return null;
//     }
//   }
// }
