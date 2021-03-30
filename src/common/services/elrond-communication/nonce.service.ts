import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { ElrondProxyService } from './elrond-proxy.service';
import { Address, Nonce } from '@elrondnetwork/erdjs/out';

@Injectable()
export class NonceService {
  private nonceTTL = 6;

  constructor(
    private redisService: RedisService,
    private elrondProxyService: ElrondProxyService,
  ) {}

  async getAccountWithNextAvailableNonce(address: string) {
    const account = await this.elrondProxyService
      .getService()
      .getAccount(new Address(address));
    const cacheKey = 'nonce_' + account.address;
    if (await this.redisService.getClient().exists(cacheKey)) {
      const cachedValue = await this.redisService.getClient().incr(cacheKey);
      if (cachedValue > account.nonce.valueOf()) {
        account.nonce = new Nonce(cachedValue);
      }
      return account;
    }

    await this.redisService
      .getClient()
      .set(cacheKey, account.nonce.valueOf(), 'ex', this.nonceTTL);
    return account;
  }
}
