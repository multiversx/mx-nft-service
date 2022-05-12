import { AccountsStatsService } from './accounts-stats.service';
import { Test } from '@nestjs/testing';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { ElrondApiService, ElrondCommunicationModule } from 'src/common';
import { ElrondApiServiceMock } from 'src/common/services/elrond-communication/elrond-api.service.mock';
import { CachingModule } from 'src/common/services/caching/caching.module';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AccountStatsRepositoryMock } from 'src/db/account-stats/account-stats.repository-mock';

describe('AccountsStatsService', () => {
  let service: AccountsStatsService;
  const ElrondApiServiceProvider = {
    provide: ElrondApiService,
    useClass: ElrondApiServiceMock,
  };

  const AccountStatsRepositoryProvider = {
    provide: AccountStatsRepository,
    useClass: AccountStatsRepositoryMock,
  };

  // const RedisCacheServiceProvider = {
  //   provide: RedisCacheService,
  //   useClass: ElrondApiServiceMock,
  // };

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
        AccountsStatsService,
        // RedisCacheServiceProvider,
      ],
      imports: [
        WinstonModule.forRoot({
          transports: logTransports,
        }),
        CachingModule,
      ],
    }).compile();

    service = moduleRef.get<AccountsStatsService>(AccountsStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
