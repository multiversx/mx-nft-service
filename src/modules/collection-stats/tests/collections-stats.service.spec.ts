import { CollectionsStatsService } from '../collections-stats.service';
import { Test } from '@nestjs/testing';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { RedisCacheServiceMock } from 'src/common/services/caching/redis-cache.service.mock';
import { ElrondApiServiceMock } from 'src/common/services/elrond-communication/elrond-api.service.mock';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AccountStatsRepositoryMock } from 'src/db/account-stats/account-stats.repository-mock';

describe('CollectionsStatsService', () => {
  let service: CollectionsStatsService;
  const ElrondApiServiceProvider = {
    provide: ElrondApiService,
    useClass: ElrondApiServiceMock,
  };

  const AccountStatsRepositoryProvider = {
    provide: AccountStatsRepository,
    useClass: AccountStatsRepositoryMock,
  };

  const RedisCacheServiceProvider = {
    provide: RedisCacheService,
    useClass: RedisCacheServiceMock,
  };

  const logTransports: Transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        nestWinstonModuleUtilities.format.nestLike(),
      ),
    }),
  ];
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ElrondApiServiceProvider,
        AccountStatsRepositoryProvider,
        CollectionsStatsService,
        RedisCacheServiceProvider,
      ],
      imports: [
        WinstonModule.forRoot({
          transports: logTransports,
        }),
      ],
    }).compile();

    service = moduleRef.get<CollectionsStatsService>(CollectionsStatsService);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
