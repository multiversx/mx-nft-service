import { Test, TestingModule } from '@nestjs/testing';
import { RedlockService } from './redlock.service';
import { RedisService } from 'nestjs-redis';

class RedisMock{
  exists(cacheKey){
    return false;
  }
  incr() {}
  set() {}
  ttl() {}
}

export class RedisServiceMock {
  getClient() {
    return new RedisMock();
  }
}

describe('RedlockService', () => {
  let service: RedlockService;

  const RedisServiceProvider = {
    provide: RedisService,
    useClass: RedisServiceMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedlockService,
        RedisServiceProvider
      ],
    }).compile();

    service = module.get<RedlockService>(RedlockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
