import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsDataSetterService } from '../analytics-data.setter.service';
import { XNftsAnalyticsEntity } from '../entities/analytics.entity';
import { Logger } from '@nestjs/common';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';

describe('Analytics Data Setter Service', () => {
  let service: AnalyticsDataSetterService;
  let nftAnalyticsRepository: any;
  const insert = jest.fn().mockReturnThis();
  const into = jest.fn().mockReturnThis();
  const values = jest.fn().mockReturnThis();
  const orUpdate = jest.fn().mockReturnThis();
  const validInputData = {
    data: {
      'QWTCOINS-27203b': {
        usdPrice: 37.64373293576205,
        volume: 0.367,
        volumeUSD: '13.81524998742467235',
        paymentToken: 'EGLD',
        marketplaceKey: 'xoxno',
      },
    },
    timestamp: 12121,
    ingestLast: false,
  };

  const invalidInputData = {
    data: 'test',
    timestamp: 12121,
    ingestLast: false,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AnalyticsDataSetterService,
        {
          provide: Logger,
          useValue: {
            error: jest.fn().mockImplementation(() => {}),
          },
        },
        {
          provide: getRepositoryToken(XNftsAnalyticsEntity, 'timescaledb'),
          useFactory: () => ({
            save: jest.fn(() => true),
          }),
        },
      ],
    }).compile();

    service = module.get<AnalyticsDataSetterService>(AnalyticsDataSetterService);
    nftAnalyticsRepository = module.get(getRepositoryToken(XNftsAnalyticsEntity, 'timescaledb'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ingest', () => {
    it('throws error when input data not in correct format', async () => {
      const execute = jest.fn(() => {});
      nftAnalyticsRepository.createQueryBuilder = jest.fn(() => ({
        insert,
        into,
        values,
        orUpdate,
        execute,
      }));

      await expect(service.ingest(invalidInputData)).rejects.toThrowError(TypeError);
    });

    it('throws error when execute fails and ingestlast true', async () => {
      const execute = jest.fn(() => {
        throw new Error();
      });
      nftAnalyticsRepository.createQueryBuilder = jest.fn(() => ({
        insert,
        into,
        values,
        orUpdate,
        execute,
      }));
      await expect(service.ingest({ ...validInputData, ingestLast: true })).rejects.toThrowError(Error);
    });
  });

  it('returns undefined when ingestlast false and we have less the 20 data events', async () => {
    const execute = jest.fn(() => {
      throw new Error();
    });
    nftAnalyticsRepository.createQueryBuilder = jest.fn(() => ({
      insert,
      into,
      values,
      orUpdate,
      execute,
    }));

    await expect(service.ingest(validInputData)).resolves.toBeUndefined();
  });

  describe('ingestSingleEvent', () => {
    it('throws error when input data not in correct format', async () => {
      const execute = jest.fn(() => {});
      nftAnalyticsRepository.createQueryBuilder = jest.fn(() => ({
        insert,
        into,
        values,
        orUpdate,
        execute,
      }));

      await expect(service.ingestSingleEvent(invalidInputData)).rejects.toThrowError(TypeError);
    });

    it('throws error when execute fails', async () => {
      const execute = jest.fn(() => {
        throw new Error();
      });
      nftAnalyticsRepository.createQueryBuilder = jest.fn(() => ({
        insert,
        into,
        values,
        orUpdate,
        execute,
      }));

      await expect(service.ingestSingleEvent({ ...validInputData })).rejects.toThrowError(Error);
    });

    it('does not throw error when valid input', async () => {
      const execute = jest.fn().mockReturnValueOnce({});
      nftAnalyticsRepository.createQueryBuilder = jest.fn(() => ({
        insert,
        into,
        values,
        orUpdate,
        execute,
      }));

      await expect(service.ingestSingleEvent(validInputData)).resolves.not.toThrow();
    });
  });
});
