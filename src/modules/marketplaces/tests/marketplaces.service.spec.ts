import { Test, TestingModule } from '@nestjs/testing';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { CollectionType } from 'src/modules/assets/models';
import { MarketplacesService } from '../marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces-caching.service';
import {
  MarketplaceCollectionEntity,
  MarketplaceEntity,
} from 'src/db/marketplaces';
import { MarketplaceTypeEnum } from '../models/MarketplaceType.enum';
import { MarketplaceFilters } from '../models/Marketplace.Filter';
import { Marketplace } from '../models';
import { WhitelistCollectionRequest } from '../models/requests/whitelistMinterRequest';
import { BadRequestError } from 'src/common/models/errors/bad-request-error';
import { Logger } from '@nestjs/common';

describe('Marketplaces Service', () => {
  let service: MarketplacesService;
  let module: TestingModule;
  const [inputMarketplace, inputCount] = [
    [
      new MarketplaceEntity({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      }),
      new MarketplaceEntity({
        address: 'address2',
        name: 'name2',
        key: 'common',
        type: MarketplaceTypeEnum.Internal,
      }),
    ],
    2,
  ];

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        MarketplacesService,
        Logger,
        {
          provide: MarketplacesCachingService,
          useFactory: () => ({}),
        },
        {
          provide: PersistenceService,
          useFactory: () => ({}),
        },
      ],
    }).compile();

    service = module.get<MarketplacesService>(MarketplacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMarketplaces', () => {
    it('when database layer throws error returns empty array', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      persistenceService.getMarketplaces = jest.fn(() => {
        throw new Error();
      });
      await expect(service.getMarketplaces()).rejects.toThrowError(Error);
    });

    it('without filters returns full list', async () => {
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new CollectionType({
        items: [
          new Marketplace({
            address: 'address',
            name: 'name',
            key: 'xoxno',
            type: MarketplaceTypeEnum.External,
          }),
          new Marketplace({
            address: 'address2',
            name: 'name2',
            key: 'common',
            type: MarketplaceTypeEnum.Internal,
          }),
        ],
        count: 2,
      });

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaces();

      expect(result).toMatchObject(expectedResult);
    });
    it('when filters by marketplaceKey and marketplaceAddress returns list with one item', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new CollectionType({
        items: [
          new Marketplace({
            address: 'address',
            name: 'name',
            key: 'xoxno',
            type: MarketplaceTypeEnum.External,
          }),
        ],
        count: 1,
      });
      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaces(
        10,
        0,
        new MarketplaceFilters({
          marketplaceAddress: 'address',
          marketplaceKey: 'xoxno',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by marketplaceKey list with one item', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new CollectionType({
        items: [
          new Marketplace({
            address: 'address',
            name: 'name',
            key: 'xoxno',
            type: MarketplaceTypeEnum.External,
          }),
        ],
        count: 1,
      });
      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaces(
        10,
        0,
        new MarketplaceFilters({
          marketplaceKey: 'xoxno',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by missing marketplaceKey returns empty list', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new CollectionType({
        items: [],
        count: 0,
      });
      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaces(
        10,
        0,
        new MarketplaceFilters({
          marketplaceKey: 'missingKey',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by missing marketplaceKey but valid address returns empty list', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new CollectionType({
        items: [],
        count: 0,
      });
      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaces(
        10,
        0,
        new MarketplaceFilters({
          marketplaceKey: 'missingKey',
          marketplaceAddress: 'address',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by missing address returns empty list', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new CollectionType({
        items: [],
        count: 0,
      });
      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaces(
        10,
        0,
        new MarketplaceFilters({
          marketplaceAddress: 'missingAddress',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getInternalMarketplacesByAddress', () => {
    it('returns internal marketplace for address', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = [
        new Marketplace({
          address: 'address2',
          name: 'name2',
          key: 'common',
          type: MarketplaceTypeEnum.Internal,
        }),
      ];

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getInternalMarketplacesByAddress('address2');

      expect(result).toMatchObject(expectedResult);
    });

    it('when no internal marketplace for specified address returns empty array', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = [];

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getInternalMarketplacesByAddress(
        'notFoundAddress',
      );

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getInternalMarketplacesAddreses', () => {
    it('returns list of addresses of internal marketplaces', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = ['address2'];

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getInternalMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });

    it('when no internal marketplace returns empty array', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = [];

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: [
            new MarketplaceEntity({
              address: 'address',
              name: 'name',
              key: 'xoxno',
              type: MarketplaceTypeEnum.External,
            }),
            new Marketplace({
              address: 'address2',
              name: 'name2',
              key: 'common',
              type: MarketplaceTypeEnum.External,
            }),
          ],
          count: inputCount,
        }),
      );

      const result = await service.getInternalMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getExternalMarketplacesAddreses', () => {
    it('returns list of addresses of external marketplaces', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = ['address'];

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getExternalMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });

    it('when no expernal marketplace exists returns empty array', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = [];

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: [
            new Marketplace({
              address: 'address',
              name: 'name',
              key: 'xoxno',
              type: MarketplaceTypeEnum.Internal,
            }),
            new Marketplace({
              address: 'address2',
              name: 'name2',
              key: 'common',
              type: MarketplaceTypeEnum.Internal,
            }),
          ],
          count: inputCount,
        }),
      );

      const result = await service.getExternalMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getMarketplacesAddreses', () => {
    it('returns list of addresses for all marketplaces', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = ['address', 'address2'];

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });

    it('when no marketplace exists returns empty array', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = [];

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: [],
          count: 0,
        }),
      );

      const result = await service.getMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getMarketplaceAddressByKey', () => {
    it('whern searched marketplace exists returns marketplace address ', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = 'address';

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaceAddressByKey('xoxno');

      expect(result).toMatch(expectedResult);
    });

    it('whern searched marketplace doen not exists returns undefied', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: [],
          count: 0,
        }),
      );

      const result = await service.getMarketplaceAddressByKey('invalidKey');

      expect(result).toBeUndefined();
    });
  });

  describe('getMarketplaceAddressByKey', () => {
    it('whern searched marketplace exists returns marketplace address ', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = 'address';

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaceAddressByKey('xoxno');

      expect(result).toMatch(expectedResult);
    });

    it('whern searched marketplace doen not exists returns empty array', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: [],
          count: 0,
        }),
      );

      const result = await service.getMarketplaceAddressByKey('invalidKey');

      expect(result).toBeUndefined();
    });
  });

  describe('getMarketplaceByKey', () => {
    it('whern searched marketplace exists returns marketplace address ', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new Marketplace({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      });

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaceByKey('xoxno');

      expect(result).toMatchObject(expectedResult);
    });

    it('when searched marketplace doen not exists returns empty array', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: [],
          count: 0,
        }),
      );

      const result = await service.getMarketplaceByKey('invalidKey');

      expect(result).toBeUndefined();
    });
  });

  describe('getMarketplaceByType', () => {
    it('when searched for internal marketplace returns the interl marketplace', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new Marketplace({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      });

      persistenceService.getMarketplaceByAddress = jest
        .fn()
        .mockReturnValueOnce(inputMarketplace[0]);
      cachingService.getMarketplaceByAddressAndCollection = jest
        .fn()
        .mockReturnValueOnce(
          new Marketplace({
            address: 'address2',
            name: 'name2',
            key: 'common',
            type: MarketplaceTypeEnum.Internal,
          }),
        );

      const result = await service.getMarketplaceByType(
        'address',
        MarketplaceTypeEnum.External,
      );

      expect(result).toMatchObject(expectedResult);
    });

    it('when searched for internal marketplace returns the interl marketplace', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      const expectedResult = new Marketplace({
        address: 'address2',
        name: 'name2',
        key: 'common',
        type: MarketplaceTypeEnum.Internal,
      });

      persistenceService.getMarketplaceByAddress = jest
        .fn()
        .mockReturnValueOnce(inputMarketplace[0]);

      cachingService.getMarketplaceByAddressAndCollection = jest
        .fn()
        .mockReturnValueOnce(
          new Marketplace({
            address: 'address2',
            name: 'name2',
            key: 'common',
            type: MarketplaceTypeEnum.Internal,
          }),
        );

      const result = await service.getMarketplaceByType(
        'address2',
        MarketplaceTypeEnum.Internal,
        'collection',
      );

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getMarketplacesFromDb', () => {
    it('returns all marketplaces from db', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);

      const expectedResult = new CollectionType({
        items: [
          new Marketplace({
            address: 'address',
            name: 'name',
            key: 'xoxno',
            type: MarketplaceTypeEnum.External,
          }),
          new Marketplace({
            address: 'address2',
            name: 'name2',
            key: 'common',
            type: MarketplaceTypeEnum.Internal,
          }),
        ],
        count: 2,
      });

      persistenceService.getMarketplaces = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace, inputCount]);

      const result = await service.getMarketplacesFromDb();

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getMarketplaceByAddressAndCollectionFromDb', () => {
    it('returns marketplace for specified address and collection', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);

      const expectedResult = new Marketplace({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      });

      persistenceService.getMarketplaceByAddressAndCollection = jest
        .fn()
        .mockReturnValueOnce([inputMarketplace[0]]);

      const result = await service.getMarketplaceByAddressAndCollectionFromDb(
        '',
        '',
      );
      expect(result).toMatchObject(expectedResult);
    });

    it('returns null if no marketplace from keys', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByAddressAndCollection = jest
        .fn()
        .mockReturnValueOnce([]);

      const result = await service.getMarketplaceByAddressAndCollectionFromDb(
        '',
        '',
      );

      expect(result).toBeNull();
    });
  });

  describe('getMarketplaceByAddress', () => {
    it('returns marketplace for specified address and collection', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);

      const expectedResult = new Marketplace({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      });

      persistenceService.getMarketplaceByAddress = jest
        .fn()
        .mockReturnValueOnce(inputMarketplace[0]);

      const result = await service.getMarketplaceByAddress('');
      expect(result).toMatchObject(expectedResult);
    });

    it('returns null if no marketplace from keys', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByAddress = jest
        .fn()
        .mockReturnValueOnce([]);

      const result = await service.getMarketplaceByAddress('');

      expect(result).toBeNull();
    });
  });

  describe('whitelistCollectionOnMarketplace', () => {
    it('when marketplace not found throws error', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );
      persistenceService.saveMarketplaceCollection = jest
        .fn()
        .mockReturnValueOnce(
          new MarketplaceCollectionEntity({
            collectionIdentifier: 'collection',
            marketplaceId: 2,
          }),
        );

      await expect(
        service.whitelistCollectionOnMarketplace(
          new WhitelistCollectionRequest(),
        ),
      ).rejects.toThrowError(BadRequestError);
    });

    it('when marketplace exists and save fails returns false', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );
      persistenceService.saveMarketplaceCollection = jest.fn(() => {
        throw new Error();
      });

      const expectedResult = await service.whitelistCollectionOnMarketplace(
        new WhitelistCollectionRequest({ marketplaceKey: 'xoxno' }),
      );

      expect(expectedResult).toBeFalsy();
    });

    it('when marketplace exists and save is succesfull returns true', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MarketplacesCachingService>(
        MarketplacesCachingService,
      );

      cachingService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplace,
          count: inputCount,
        }),
      );
      cachingService.invalidateMarketplacesCache = jest.fn();

      persistenceService.saveMarketplaceCollection = jest
        .fn()
        .mockReturnValueOnce(
          new MarketplaceCollectionEntity({
            collectionIdentifier: 'collection',
            marketplaceId: 2,
          }),
        );
      const expectedResult = await service.whitelistCollectionOnMarketplace(
        new WhitelistCollectionRequest({ marketplaceKey: 'xoxno' }),
      );

      expect(expectedResult).toBeTruthy();
    });
  });

  describe('getAllCollectionsIdentifiersFromDb', () => {
    it('returns internal marketplace for address', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);

      const expectedResult = ['testIdentifier'];

      persistenceService.getAllMarketplaceCollections = jest
        .fn()
        .mockReturnValueOnce([
          new MarketplaceCollectionEntity({
            collectionIdentifier: 'testIdentifier',
          }),
        ]);

      const result = await service.getAllCollectionsIdentifiersFromDb();

      expect(result).toMatchObject(expectedResult);
    });

    it('when no internal marketplace for specified address returns empty array', async () => {
      const persistenceService =
        module.get<PersistenceService>(PersistenceService);

      const expectedResult = [];

      persistenceService.getAllMarketplaceCollections = jest
        .fn()
        .mockReturnValueOnce([]);

      const result = await service.getAllCollectionsIdentifiersFromDb();
      expect(result).toMatchObject(expectedResult);
    });
  });
});
