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
import { TagsService } from '../tags.service';
import { Tag } from '../models';

describe('SearchService', () => {
  let service: TagsService;
  const ElrondApiServiceProvider = {
    provide: ElrondApiService,
    useClass: ElrondApiServiceMock,
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
        TagsService,
        RedisCacheServiceProvider,
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
      const results = await service.getTags();
      const expectedResult = [
        new Tag({ tag: 'tag1', count: 12 }),
        new Tag({ tag: 'tag2', count: 10 }),
      ];
      expect(results).toStrictEqual(expectedResult);
    });
  });
});
