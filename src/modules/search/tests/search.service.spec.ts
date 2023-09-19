import { Test, TestingModule } from '@nestjs/testing';
import { MxApiService, MxIdentityService } from 'src/common';
import { SearchService } from '../search.service';
import { SearchItemResponse, SearchNftCollectionResponse } from '../models/SearchItemResponse';
import { Logger } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { CollectionsGetterService } from 'src/modules/nftCollections/collections-getter.service';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

describe('SearchService', () => {
  let service: SearchService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        SearchService,
        RedisCacheService,
        {
          provide: Logger,
          useValue: {
            error: jest.fn().mockImplementation(() => {}),
          },
        },
        {
          provide: MxIdentityService,
          useFactory: () => ({}),
        },
        {
          provide: CollectionsGetterService,
          useFactory: () => ({}),
        },
        {
          provide: RedisCacheService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
        {
          provide: MxApiService,
          useValue: {
            getNftsCountForCollection: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCollections', () => {
    it('should return the collections identifiers', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() =>
        Promise.resolve([
          new SearchNftCollectionResponse({
            identifier: 'searchTerm',
            name: undefined,
            verified: false,
          }),
        ]),
      );
      const results = await service.getCollections('searchTerm');

      expect(results).toStrictEqual([
        new SearchNftCollectionResponse({
          identifier: 'searchTerm',
          name: undefined,
          verified: false,
        }),
      ]);
    });

    it('is called with expected arguments', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      const stub = jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => Promise.resolve({ key: 'identifier', value: '4' }));
      const expectedCacheKey = `${CacheInfo.SearchCollection.key}_searchTerm`;
      const results = await service.getCollections('searchTerm');
      expect(stub).toHaveBeenCalled();
      expect(stub).toBeCalledWith(expectedCacheKey, expect.anything(), CacheInfo.SearchCollection.ttl);
    });

    it('when error returns empty array', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => {
        throw new Error();
      });

      const results = await service.getCollections('searchTerm');
      expect(results).toMatchObject([]);
    });
  });

  describe('getNfts', () => {
    it('should return the nfts identifiers', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() =>
        Promise.resolve([
          new SearchNftCollectionResponse({
            identifier: 'searchTerm',
            name: undefined,
            verified: false,
          }),
        ]),
      );
      const results = await service.getNfts('searchTerm');

      expect(results).toStrictEqual([
        new SearchNftCollectionResponse({
          identifier: 'searchTerm',
          name: undefined,
          verified: false,
        }),
      ]);
    });

    it('is called with expected arguments', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      const stub = jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => Promise.resolve({ key: 'identifier', value: '4' }));
      const expectedCacheKey = `${CacheInfo.SearchNfts.key}_searchTerm`;
      const results = await service.getNfts('searchTerm');
      expect(stub).toHaveBeenCalled();
      expect(stub).toBeCalledWith(expectedCacheKey, expect.anything(), CacheInfo.SearchNfts.ttl);
    });

    it('when error returns empty array', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => {
        throw new Error();
      });

      const results = await service.getNfts('searchTerm');
      expect(results).toMatchObject([]);
    });
  });

  describe('getHerotags', () => {
    it('should return the herotags', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest
        .spyOn(redisCacheService, 'getOrSet')
        .mockImplementation(() => Promise.resolve([new SearchItemResponse({ identifier: 'address', name: undefined })]));
      const results = await service.getHerotags('searchTerm');
      expect(results).toStrictEqual([new SearchItemResponse({ identifier: 'address', name: undefined })]);
    });

    it('is called with expected arguments', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      const stub = jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => Promise.resolve({ key: 'identifier', value: '4' }));
      const expectedCacheKey = `${CacheInfo.SearchAccount.key}_searchTerm`;
      const results = await service.getHerotags('searchTerm');
      expect(stub).toHaveBeenCalled();
      expect(stub).toBeCalledWith(expectedCacheKey, expect.anything(), CacheInfo.SearchAccount.ttl);
    });

    it('when error returns empty array', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => {
        throw new Error();
      });

      const results = await service.getHerotags('searchTerm');
      expect(results).toMatchObject([]);
    });
  });

  describe('getTags', () => {
    it('should return all the tags with that search term', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest
        .spyOn(redisCacheService, 'getOrSet')
        .mockImplementation(() => Promise.resolve([new SearchItemResponse({ identifier: 'searchTerm' })]));

      const results = await service.getTags('searchTerm');

      expect(results).toStrictEqual([new SearchItemResponse({ identifier: 'searchTerm' })]);
    });

    it('is called with expected arguments', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      const stub = jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => Promise.resolve({}));
      const expectedCacheKey = `${CacheInfo.SearchAccount.key}_searchTerm`;
      const results = await service.getTags('searchTerm');
      expect(stub).toHaveBeenCalled();
      expect(stub).toBeCalledWith(expectedCacheKey, expect.anything(), CacheInfo.SearchAccount.ttl);
    });

    it('when error returns empty array', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => {
        throw new Error();
      });

      const results = await service.getTags('searchTerm');
      expect(results).toMatchObject([]);
    });
  });
});
