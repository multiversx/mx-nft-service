import { Test } from '@nestjs/testing';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import {
  ElrondApiService,
  ElrondIdentityService,
  RedisCacheService,
} from 'src/common';
import { RedisCacheServiceMock } from 'src/common/services/caching/redis-cache.service.mock';
import { ElrondApiServiceMock } from 'src/common/services/elrond-communication/elrond-api.service.mock';
import { SearchService } from '../search.service';
import { ElrondIdentityServiceMock } from 'src/common/services/elrond-communication/elrond-identity.service.mock';

describe('SearchService', () => {
  let service: SearchService;
  const ElrondApiServiceProvider = {
    provide: ElrondApiService,
    useClass: ElrondApiServiceMock,
  };

  const ElrondIdentityServiceProvider = {
    provide: ElrondIdentityService,
    useClass: ElrondIdentityServiceMock,
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
        ElrondIdentityServiceProvider,
        SearchService,
        RedisCacheServiceProvider,
      ],
      imports: [
        WinstonModule.forRoot({
          transports: logTransports,
        }),
      ],
    }).compile();

    service = moduleRef.get<SearchService>(SearchService);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCollections', () => {
    it('should return the collections identifiers', async () => {
      const results = await service.getCollections('searchTerm');

      expect(results).toStrictEqual(['searchTerm']);
    });
  });

  describe('getNfts', () => {
    it('should return the nfts identifiers', async () => {
      const results = await service.getNfts('searchTerm');

      expect(results).toStrictEqual(['searchTerm']);
    });
  });

  describe('getHerotags', () => {
    it('should return the herotags', async () => {
      const results = await service.getHerotags('searchTerm');

      expect(results).toStrictEqual(['searchTerm']);
    });
  });

  describe('getTags', () => {
    it('should return all the tags with that search term', async () => {
      const results = await service.getTags('searchTerm');

      expect(results).toStrictEqual(['searchTerm']);
    });
  });
});
