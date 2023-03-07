import { AccountsStatsService } from '../accounts-stats.service';
import { Test } from '@nestjs/testing';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { MxApiService } from 'src/common';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { MxApiServiceMock } from 'src/common/services/mx-communication/mx-api.service.mock';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AccountStatsRepositoryMock } from 'src/db/account-stats/account-stats.repository-mock';
import { AccountsStatsCachingServiceMock } from './accounts-stats.caching.service.mock';
import { AccountsStatsCachingService } from '../accounts-stats.caching.service';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { MarketplacesServiceMock } from 'src/modules/marketplaces/marketplaces.service.mock';

describe.skip('AccountsStatsService', () => {
  let service: AccountsStatsService;
  const MxApiServiceProvider = {
    provide: MxApiService,
    useClass: MxApiServiceMock,
  };

  const AccountsStatsCachingServiceProvider = {
    provide: AccountsStatsCachingService,
    useClass: AccountsStatsCachingServiceMock,
  };

  const MarketplaceServiceProvider = {
    provide: MarketplacesService,
    useClass: MarketplacesServiceMock,
  };

  const AccountStatsRepositoryProvider = {
    provide: AccountStatsRepository,
    useClass: AccountStatsRepositoryMock,
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
        AccountStatsRepositoryProvider,
        AccountsStatsService,
        MarketplaceServiceProvider,
        AccountsStatsCachingServiceProvider,
      ],
      imports: [
        WinstonModule.forRoot({
          transports: logTransports,
        }),
      ],
    }).compile();

    service = moduleRef.get<AccountsStatsService>(AccountsStatsService);
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClaimableCount', () => {
    it('should return total claimable count', async () => {
      const results = await service.getClaimableCount('');

      expect(results).toStrictEqual(4);
    });
  });

  describe('getCollectedCount', () => {
    it('should return total collected nfts count', async () => {
      const results = await service.getCollectedCount('');

      expect(results).toStrictEqual(4);
    });
  });

  describe('getCollectionsCount', () => {
    it('should return total collections count', async () => {
      const results = await service.getCollectionsCount('');

      expect(results).toStrictEqual(2);
    });
  });

  describe('getCreationsCount', () => {
    it('should return total created nfts count', async () => {
      const results = await service.getArtistCreationsInfo('');

      expect(results).toStrictEqual(10);
    });
  });

  describe('getStats', () => {
    it('should return the public account stats when isOwner is false', async () => {
      const expected = new AccountStatsEntity({
        address:
          'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        auctions: '2',
        biddingBalance: '0',
        orders: '0',
      });
      const results = await service.getStats('', false);
      expect(results).toMatchObject(expected);
    });

    it('should return the owner account stats when isOwner is true', async () => {
      const expected = new AccountStatsEntity({
        address:
          'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        auctions: '3',
        biddingBalance: '0',
        orders: '0',
      });
      const results = await service.getStats(
        'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        true,
      );
      expect(results).toMatchObject(expected);
    });
  });
});
