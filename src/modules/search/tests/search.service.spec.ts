import { Test } from '@nestjs/testing';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { MxApiService, MxIdentityService } from 'src/common';
import { MxApiServiceMock } from 'src/common/services/mx-communication/mx-api.service.mock';
import { SearchService } from '../search.service';
import { MxIdentityServiceMock } from 'src/common/services/mx-communication/mx-identity.service.mock';
import {
  SearchItemResponse,
  SearchNftCollectionResponse,
} from '../models/SearchItemResponse';
import { SearchModuleGraph } from '../search.module';

describe.skip('SearchService', () => {
  let service: SearchService;
  const MxApiServiceProvider = {
    provide: MxApiService,
    useClass: MxApiServiceMock,
  };

  const MxIdentityServiceProvider = {
    provide: MxIdentityService,
    useClass: MxIdentityServiceMock,
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
        MxIdentityServiceProvider,
        SearchService,
      ],
      imports: [
        WinstonModule.forRoot({
          transports: logTransports,
        }),
        SearchModuleGraph,
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

      expect(results).toStrictEqual([
        new SearchNftCollectionResponse({
          identifier: 'searchTerm',
          name: undefined,
          verified: false,
        }),
      ]);
    });
  });

  describe('getNfts', () => {
    it('should return the nfts identifiers', async () => {
      const results = await service.getNfts('searchTerm');

      expect(results).toStrictEqual([
        new SearchNftCollectionResponse({
          identifier: 'searchTerm',
          name: undefined,
          verified: false,
        }),
      ]);
    });
  });

  describe('getHerotags', () => {
    it('should return the herotags', async () => {
      const results = await service.getHerotags('searchTerm');

      expect(results).toStrictEqual([
        new SearchItemResponse({ identifier: 'address', name: undefined }),
      ]);
    });
  });

  describe('getTags', () => {
    it('should return all the tags with that search term', async () => {
      const results = await service.getTags('searchTerm');

      expect(results).toStrictEqual([
        new SearchItemResponse({ identifier: 'searchTerm' }),
      ]);
    });
  });
});
