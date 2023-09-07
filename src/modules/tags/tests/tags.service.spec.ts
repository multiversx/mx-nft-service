import { Test } from '@nestjs/testing';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { MxApiService } from 'src/common';
import { MxApiServiceMock } from 'src/common/services/mx-communication/mx-api.service.mock';
import { TagsService } from '../tags.service';
import { Tag } from '../models';
import { TagsFilter } from '../models/Tags.Filter';

describe.skip('SearchService', () => {
  let service: TagsService;
  const MxApiServiceProvider = {
    provide: MxApiService,
    useClass: MxApiServiceMock,
  };

  const logTransports: Transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.timestamp(), nestWinstonModuleUtilities.format.nestLike()),
    }),
  ];
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MxApiServiceProvider, TagsService],
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
      const expectedResult = [[new Tag({ tag: 'tag1', count: 12 }), new Tag({ tag: 'tag2', count: 10 })], 2];
      expect(results).toStrictEqual(expectedResult);
    });
  });
});
