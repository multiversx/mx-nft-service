import { CollectionsStatsService } from '../collections-stats.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MxApiService } from 'src/common';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

describe('CollectionsStatsService', () => {
  let service: CollectionsStatsService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        CollectionsStatsService,
        {
          provide: Logger,
          useValue: {
            error: jest.fn().mockImplementation(() => {}),
          },
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
        {
          provide: PersistenceService,
          useValue: {
            getOrSet: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CollectionsStatsService>(CollectionsStatsService);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getItemsCount', () => {
    it('should return total nfts count', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => Promise.resolve({ key: 'identifier', value: '4' }));

      const results = await service.getItemsCount('identifier');

      expect(results).toStrictEqual({ key: 'identifier', value: '4' });
    });

    it('is called with expected arguments', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      const stub = jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => Promise.resolve({ key: 'identifier', value: '4' }));

      const results = await service.getItemsCount('identifier');
      const expectedCacheKey = `${CacheInfo.CollectionAssetsCount.key}_identifier`;
      expect(stub).toHaveBeenCalled();
      expect(stub).toBeCalledWith(expectedCacheKey, expect.anything(), CacheInfo.CollectionAssetsCount.ttl);
      expect(results).toMatchObject({ key: 'identifier', value: '4' });
    });

    it('when error return value 0', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => {
        throw new Error();
      });

      const results = await service.getItemsCount('identifier');
      expect(results).toMatchObject({ key: 'identifier', value: '0' });
    });
  });

  describe('getStats', () => {
    it('should return the collection stats', async () => {
      const expected = new CollectionStatsEntity({
        activeAuctions: 2,
        auctionsEnded: 4,
        maxPrice: '1111111111111',
        minPrice: '1000000000000',
        saleAverage: '11111111100',
        volumeTraded: '211111111110',
      });

      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() =>
        Promise.resolve(
          new CollectionStatsEntity({
            activeAuctions: 2,
            auctionsEnded: 4,
            maxPrice: '1111111111111',
            minPrice: '1000000000000',
            saleAverage: '11111111100',
            volumeTraded: '211111111110',
          }),
        ),
      );

      const results = await service.getStats('test');
      expect(results).toMatchObject(expected);
    });

    it('it is called with expected arguments', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      const stub = jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => Promise.resolve({ key: 'identifier', value: '4' }));

      const results = await service.getStats('identifier');
      const expectedCacheKey = `collection_stats_identifier__EGLD`;
      expect(stub).toHaveBeenCalled();
      expect(stub).toBeCalledWith(expectedCacheKey, expect.anything(), 5 * Constants.oneMinute());
      expect(results).toMatchObject({ key: 'identifier', value: '4' });
    });

    it('when error return value default object', async () => {
      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      jest.spyOn(redisCacheService, 'getOrSet').mockImplementation(() => {
        throw new Error();
      });

      const results = await service.getStats('test');
      expect(results).toMatchObject(new CollectionStatsEntity());
    });
  });
});
