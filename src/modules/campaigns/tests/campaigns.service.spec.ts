import { Test, TestingModule } from '@nestjs/testing';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { CampaignsService } from '../campaigns.service';
import { CachingService } from '@multiversx/sdk-nestjs';
import { NftMinterAbiService } from '../nft-minter.abi.service';
import { ClientProxy } from '@nestjs/microservices';
import { CollectionType } from 'src/modules/assets/models';
import { CampaignsFilter } from 'src/modules/common/filters/filtersTypes';
import {
  getCampaignsExpectedList,
  getCampaignsInputMockData,
  getCampaignsMockData,
  getSaveCampaignsExpectedResult,
  saveCampaignInput,
} from './campaigns.testData';

describe('Campaigns Service', () => {
  let service: CampaignsService;
  let module: TestingModule;
  const [inputCampaigns, inputCount] = getCampaignsInputMockData;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: 'PUBSUB_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: ClientProxy,
          useFactory: () => ({}),
        },
        {
          provide: CachingService,
          useFactory: () => ({}),
        },
        {
          provide: NftMinterAbiService,
          useFactory: () => ({}),
        },
        {
          provide: PersistenceService,
          useFactory: () => ({}),
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaigns', () => {
    it('without filters returns full list', async () => {
      const cachingService = module.get<CachingService>(CachingService);
      cachingService.getOrSetCache = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputCampaigns,
          count: inputCount,
        }),
      );

      const expectedResult = new CollectionType({
        items: getCampaignsExpectedList,
        count: 3,
      });

      const result = await service.getCampaigns();

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by campaignId and minterAddress returns list with one item', async () => {
      const cachingService = module.get<CachingService>(CachingService);
      cachingService.getOrSetCache = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputCampaigns,
          count: inputCount,
        }),
      );

      const expectedResult = new CollectionType({
        items: [getCampaignsExpectedList[0]],
        count: 1,
      });

      const result = await service.getCampaigns(
        0,
        10,
        new CampaignsFilter({
          campaignId: 'campaing1',
          minterAddress: 'address1',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by campaignId list with that campaignId', async () => {
      const cachingService = module.get<CachingService>(CachingService);
      cachingService.getOrSetCache = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputCampaigns,
          count: inputCount,
        }),
      );

      const expectedResult = new CollectionType({
        items: [getCampaignsExpectedList[0], getCampaignsExpectedList[1]],
        count: 2,
      });

      const result = await service.getCampaigns(
        0,
        10,
        new CampaignsFilter({
          campaignId: 'campaing1',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by minterAddress list with that minterAddress', async () => {
      const cachingService = module.get<CachingService>(CachingService);
      cachingService.getOrSetCache = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputCampaigns,
          count: inputCount,
        }),
      );

      const expectedResult = new CollectionType({
        items: [getCampaignsExpectedList[1]],
        count: 1,
      });

      const result = await service.getCampaigns(
        0,
        10,
        new CampaignsFilter({
          minterAddress: 'address12',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('saveCampaign', () => {
    it('when no campaign present returns empty list', async () => {
      const nftMinterService =
        module.get<NftMinterAbiService>(NftMinterAbiService);
      nftMinterService.getCampaignsForScAddress = jest
        .fn()
        .mockReturnValueOnce([]);
      const cachingService = module.get<CachingService>(CachingService);
      cachingService.getOrSetCache = jest.fn().mockReturnValueOnce(7);

      const expectedResult = [];

      const result = await service.saveCampaign('');

      expect(result).toMatchObject(expectedResult);
    });

    it('when one campaign present returns list with one item', async () => {
      const nftMinterService =
        module.get<NftMinterAbiService>(NftMinterAbiService);
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<CachingService>(CachingService);
      cachingService.getOrSetCache = jest.fn().mockReturnValueOnce(7);

      persistenceService.saveCampaign = jest
        .fn()
        .mockReturnValueOnce(saveCampaignInput[0]);
      persistenceService.saveTiers = jest.fn().mockReturnValueOnce({});

      nftMinterService.getCampaignsForScAddress = jest
        .fn()
        .mockReturnValueOnce([getCampaignsMockData[0]]);

      const expectedResult = getSaveCampaignsExpectedResult[0];

      const result = await service.saveCampaign('address');

      expect(result).toMatchObject([expectedResult]);
    });

    it('when 2 campaigns present returns list with 2 items', async () => {
      const nftMinterService =
        module.get<NftMinterAbiService>(NftMinterAbiService);
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<CachingService>(CachingService);
      cachingService.getOrSetCache = jest.fn().mockReturnValueOnce(7);

      persistenceService.saveCampaign = jest
        .fn()
        .mockReturnValueOnce(saveCampaignInput[0])
        .mockReturnValueOnce(saveCampaignInput[1]);
      persistenceService.saveTiers = jest.fn().mockReturnValueOnce({});

      nftMinterService.getCampaignsForScAddress = jest
        .fn()
        .mockReturnValueOnce(getCampaignsMockData);

      const result = await service.saveCampaign('address');

      expect(result).toMatchObject(getSaveCampaignsExpectedResult);
    });
  });
});
