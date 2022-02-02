import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { RedisDataloaderHandler } from '../assets/redis-dataloader.handler';

@Injectable()
export class AccountsRedisHandler extends RedisDataloaderHandler<string> {
  constructor(redisCacheService: RedisCacheService) {
    super(redisCacheService, 'account', 15);
  }

  mapValues(addresses: string[], accountsAddreses: { [key: string]: any[] }) {
    return addresses.map((address) => {
      return accountsAddreses[address] ? accountsAddreses[address][0] : null;
    });
  }
}
