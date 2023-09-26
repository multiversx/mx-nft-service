import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsDataGetterService } from '../analytics-data.getter.service';
import { FloorPriceDaily, SumDaily, SumMarketplaceDaily } from '../entities/sum-daily.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsAggregateValue } from 'src/modules/analytics/models/analytics-aggregate-value';

describe('Analytics Data Getter Service', () => {
  let service: AnalyticsDataGetterService;
  let module: TestingModule;
  const offset = jest.fn().mockReturnThis();
  const limit = jest.fn().mockReturnThis();
  const select = jest.fn().mockReturnThis();
  const addSelect = jest.fn().mockReturnThis();
  const andWhere = jest.fn().mockReturnThis();
  const where = jest.fn().mockReturnThis();
  const orderBy = jest.fn().mockReturnThis();
  const groupBy = jest.fn().mockReturnThis();

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AnalyticsDataGetterService,
        {
          provide: getRepositoryToken(SumDaily, 'timescaledb'),
          useFactory: () => ({}),
        },
        {
          provide: getRepositoryToken(SumMarketplaceDaily, 'timescaledb'),
          useFactory: () => ({}),
        },

        {
          provide: getRepositoryToken(FloorPriceDaily, 'timescaledb'),
          useFactory: () => ({}),
        },
      ],
    }).compile();

    service = module.get<AnalyticsDataGetterService>(AnalyticsDataGetterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTopCollectionsDaily', () => {
    it('returns empty list when no data and no key present', async () => {
      const getRawMany = jest.fn().mockReturnValueOnce([]);
      const getCount = jest.fn().mockReturnValueOnce(0);
      const sumDailyRepository = module.get(getRepositoryToken(SumDaily, 'timescaledb'));
      sumDailyRepository.createQueryBuilder = jest.fn(() => ({
        select,
        offset,
        limit,
        getRawMany,
        addSelect,
        andWhere,
        orderBy,
        groupBy,
        getCount,
      }));
      const result = await service.getTopCollectionsDaily({ metric: 'test' });
      const expectedResult = [[], 0];

      expect(result).toMatchObject(expectedResult);
    });

    it('returns list with one item when no data and the searched key', async () => {
      const getRawMany = jest.fn().mockReturnValueOnce([]);
      const getCount = jest.fn().mockReturnValueOnce(0);
      const sumDailyRepository = module.get(getRepositoryToken(SumDaily, 'timescaledb'));
      sumDailyRepository.createQueryBuilder = jest.fn(() => ({
        select,
        offset,
        limit,
        getRawMany,
        addSelect,
        andWhere,
        orderBy,
        groupBy,
        getCount,
      }));
      const result = await service.getTopCollectionsDaily({
        metric: 'test',
        series: 'test',
      });
      const expectedResult = [[new AnalyticsAggregateValue({ value: 0, series: 'test' })], 1];

      expect(result).toMatchObject(expectedResult);
    });

    it('returns list with multiple items and expected values', async () => {
      const getRawMany = jest.fn().mockReturnValueOnce([
        { value: 2, series: 'test' },
        { value: 121, series: 'test2' },
      ]);
      const getCount = jest.fn().mockReturnValueOnce(2);
      const sumDailyRepository = module.get(getRepositoryToken(SumDaily, 'timescaledb'));
      sumDailyRepository.createQueryBuilder = jest.fn(() => ({
        select,
        offset,
        limit,
        getRawMany,
        addSelect,
        andWhere,
        where,
        orderBy,
        groupBy,
        getCount,
      }));

      const [responseList, responseCount] = await service.getTopCollectionsDaily({
        metric: 'test',
      });

      const [expectedList, expectedCount] = [
        [new AnalyticsAggregateValue({ value: 2, series: 'test' }), new AnalyticsAggregateValue({ value: 121, series: 'test2' })],
        2,
      ];

      expect(responseCount).toBe(expectedCount);
      expect(responseList).toMatchObject(expectedList);
    });
  });

  describe('getFloorPriceData', () => {
    it('returns empty list when no data for specific collection', async () => {
      const getRawMany = jest.fn().mockReturnValueOnce([]);
      const floorPriceRepository = module.get(getRepositoryToken(FloorPriceDaily, 'timescaledb'));
      floorPriceRepository.createQueryBuilder = jest.fn(() => ({
        select,
        offset,
        limit,
        getRawMany,
        addSelect,
        andWhere,
        where,
        orderBy,
        groupBy,
      }));
      const result = await service.getFloorPriceData({
        time: '10d',
        metric: 'test',
        series: 'test',
      });
      const expectedResult = [];

      expect(result).toMatchObject(expectedResult);
    });

    it('returns list with multiple items and expected values', async () => {
      const getRawMany = jest.fn().mockReturnValueOnce([
        { value: 2, series: 'test' },
        { value: 121, series: 'test' },
      ]);
      const expectedResult = [
        new AnalyticsAggregateValue({ value: 2, series: 'test' }),
        new AnalyticsAggregateValue({ value: 121, series: 'test' }),
      ];
      const floorPriceRepository = module.get(getRepositoryToken(FloorPriceDaily, 'timescaledb'));
      floorPriceRepository.createQueryBuilder = jest.fn(() => ({
        select,
        offset,
        limit,
        getRawMany,
        addSelect,
        where,
        andWhere,
        orderBy,
        groupBy,
      }));

      const response = await service.getFloorPriceData({
        time: '10d',
        metric: 'test',
        series: 'test',
      });

      expect(response).toMatchObject(expectedResult);
    });
  });

  describe('getVolumeDataWithMarketplaces', () => {
    it('returns empty list when no data for specific collection', async () => {
      const getRawMany = jest.fn().mockReturnValueOnce([]);
      const sumDailyRepository = module.get(getRepositoryToken(SumMarketplaceDaily, 'timescaledb'));
      sumDailyRepository.createQueryBuilder = jest.fn(() => ({
        select,
        offset,
        limit,
        getRawMany,
        addSelect,
        andWhere,
        where,
        orderBy,
        groupBy,
      }));
      const result = await service.getVolumeDataWithMarketplaces({
        time: '10d',
        metric: 'test',
        series: 'test',
      });
      const expectedResult = [];

      expect(result).toMatchObject(expectedResult);
    });

    it('returns list with multiple items and expected values', async () => {
      const getRawMany = jest.fn().mockReturnValueOnce([
        { value: 2, series: 'test' },
        { value: 121, series: 'test' },
      ]);
      const expectedResult = [
        new AnalyticsAggregateValue({ value: 2, series: 'test' }),
        new AnalyticsAggregateValue({ value: 121, series: 'test' }),
      ];
      const sumDailyRepository = module.get(getRepositoryToken(SumMarketplaceDaily, 'timescaledb'));
      sumDailyRepository.createQueryBuilder = jest.fn(() => ({
        select,
        offset,
        limit,
        getRawMany,
        addSelect,
        where,
        andWhere,
        orderBy,
        groupBy,
      }));

      const response = await service.getVolumeDataWithMarketplaces({
        time: '10d',
        metric: 'test',
        series: 'test',
      });

      expect(response).toMatchObject(expectedResult);
    });
  });
});
