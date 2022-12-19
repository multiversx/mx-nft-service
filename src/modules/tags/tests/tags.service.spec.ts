import { Test } from '@nestjs/testing';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { MxApiService, RedisCacheService } from 'src/common';
import { RedisCacheServiceMock } from 'src/common/services/caching/redis-cache.service.mock';
import { MxApiServiceMock } from 'src/common/services/mx-communication/mx-api.service.mock';
import { TagsService } from '../tags.service';
import { Tag } from '../models';
import { TagsFilter } from '../models/Tags.Filter';
import { TagsRepository } from 'src/db/auctions/tags.repository';
import { TagsRepositoryMock } from 'src/db/auctions/tags.repository.mock';
import { CachingService } from '@elrondnetwork/erdnest';
import { CachingServiceMock } from 'src/common/services/caching/caching.service.mock';

describe.skip('SearchService', () => {
  let service: TagsService;
  const MxApiServiceProvider = {
    provide: MxApiService,
    useClass: MxApiServiceMock,
  };

  const RedisCacheServiceProvider = {
    provide: RedisCacheService,
    useClass: RedisCacheServiceMock,
  };
  const CachingServiceProvider = {
    provide: CachingService,
    useClass: CachingServiceMock,
  };

  const TagsRepositoryProvider = {
    provide: TagsRepository,
    useClass: TagsRepositoryMock,
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
        MxApiServiceProvider,
        CachingServiceProvider,
        TagsService,
        RedisCacheServiceProvider,
        TagsRepositoryProvider,
      ],
      imports: [
        WinstonModule.forRoot({
          transports: logTransports,
        }),
      ],
    }).compile();

    service = moduleRef.get<TagsService>(TagsService);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTags', () => {
    it('should return the top tags order by count', async () => {
      const results = await service.getTags(10, 10, new TagsFilter());
      const expectedResult = [
        [
          new Tag({ tag: 'tag1', count: 12 }),
          new Tag({ tag: 'tag2', count: 10 }),
        ],
        2,
      ];
      expect(results).toStrictEqual(expectedResult);
    });
  });
});
