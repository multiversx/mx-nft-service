import { Test, TestingModule } from '@nestjs/testing';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { CampaignsService } from '../campaigns.service';
import { CachingService } from '@multiversx/sdk-nestjs';
import { NftMinterAbiService } from '../nft-minter.abi.service';
import { ClientProxy } from '@nestjs/microservices';
import { Campaign } from '../models';
import { CollectionType } from 'src/modules/assets/models';
import { CampaignsFilter } from 'src/modules/common/filters/filtersTypes';

describe('Campaigns Service', () => {
  let service: CampaignsService;
  let module: TestingModule;
  const [inputCampaign, inputCount] = [
    [
      new Campaign({
        campaignId: 'campaing1',
        description: 'name',
        minterAddress: 'address1',
        maxNftsPerTransaction: 7,
      }),
      new Campaign({
        campaignId: 'campaing1',
        description: 'name',
        minterAddress: 'address12',
        maxNftsPerTransaction: 7,
      }),
      new Campaign({
        minterAddress: 'address2',
        campaignId: 'campaing2',
        description: 'name3',
        maxNftsPerTransaction: 3,
      }),
    ],
    2,
  ];

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
          items: inputCampaign,
          count: inputCount,
        }),
      );

      const expectedResult = new CollectionType({
        items: [
          new Campaign({
            campaignId: 'campaing1',
            description: 'name',
            minterAddress: 'address1',
            maxNftsPerTransaction: 7,
          }),
          new Campaign({
            campaignId: 'campaing1',
            description: 'name',
            minterAddress: 'address12',
            maxNftsPerTransaction: 7,
          }),
          new Campaign({
            minterAddress: 'address2',
            campaignId: 'campaing2',
            description: 'name3',
            maxNftsPerTransaction: 3,
          }),
        ],
        count: 3,
      });

      const result = await service.getCampaigns();

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by campaignId and minterAddress returns list with one item', async () => {
      const cachingService = module.get<CachingService>(CachingService);
      cachingService.getOrSetCache = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputCampaign,
          count: inputCount,
        }),
      );

      const expectedResult = new CollectionType({
        items: [
          new Campaign({
            campaignId: 'campaing1',
            description: 'name',
            minterAddress: 'address1',
            maxNftsPerTransaction: 7,
          }),
        ],
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
          items: inputCampaign,
          count: inputCount,
        }),
      );

      const expectedResult = new CollectionType({
        items: [
          new Campaign({
            campaignId: 'campaing1',
            description: 'name',
            minterAddress: 'address1',
            maxNftsPerTransaction: 7,
          }),
          new Campaign({
            campaignId: 'campaing1',
            description: 'name',
            minterAddress: 'address12',
            maxNftsPerTransaction: 7,
          }),
        ],
        count: 1,
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
          items: inputCampaign,
          count: inputCount,
        }),
      );

      const expectedResult = new CollectionType({
        items: [
          new Campaign({
            campaignId: 'campaing1',
            description: 'name',
            minterAddress: 'address12',
            maxNftsPerTransaction: 7,
          }),
        ],
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
});
