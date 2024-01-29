import { Test, TestingModule } from '@nestjs/testing';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { CollectionType } from 'src/modules/assets/models';
import { MarketplacesService } from '../marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces-caching.service';
import { MarketplaceCollectionEntity, MarketplaceEntity } from 'src/db/marketplaces';
import { MarketplaceState, MarketplaceTypeEnum } from '../models/MarketplaceType.enum';
import { MarketplaceFilters } from '../models/Marketplace.Filter';
import { Marketplace } from '../models';
import { RemoveWhitelistCollectionRequest, WhitelistCollectionRequest } from '../models/requests/WhitelistCollectionOnMarketplaceRequest';
import { BadRequestError } from 'src/common/models/errors/bad-request-error';
import { Logger } from '@nestjs/common';
import { WhitelistMarketplaceRequest } from '../models/requests/WhitelistMarketplaceRequest';
import { UpdateMarketplaceRequest } from '../models/requests/UpdateMarketplaceRequest';
import { CacheEventsPublisherService } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { DisabledMarketplaceEventsService } from 'src/modules/rabbitmq/blockchain-events/disable-marketplace/disable-marketplace-events.service';

describe('Marketplaces Service', () => {
  let service: MarketplacesService;
  let module: TestingModule;
  const [inputMarketplaces, inputCount] = [
    [
      new MarketplaceEntity({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
        state: MarketplaceState.Enable,
      }),
      new MarketplaceEntity({
        address: 'address2',
        name: 'name2',
        key: 'common',
        type: MarketplaceTypeEnum.Internal,
        state: MarketplaceState.Enable,
      }),
      new MarketplaceEntity({
        address: 'disabledAddress',
        name: 'name',
        key: 'test',
        type: MarketplaceTypeEnum.External,
        state: MarketplaceState.Disable,
      }),
    ],
    3,
  ];

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        MarketplacesService,
        {
          provide: Logger,
          useValue: {
            error: jest.fn().mockImplementation(() => {}),
          },
        },
        {
          provide: MarketplacesCachingService,
          useFactory: () => ({}),
        },
        {
          provide: DisabledMarketplaceEventsService,
          useFactory: () => ({}),
        },
        {
          provide: PersistenceService,
          useFactory: () => ({}),
        },
        {
          provide: CacheEventsPublisherService,
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
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      persistenceService.getMarketplaces = jest.fn(() => {
        throw new Error();
      });
      await expect(service.getMarketplaces()).rejects.toThrowError(Error);
    });

    it('without filters returns full list', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = new CollectionType({
        items: [
          new Marketplace({
            address: 'address',
            name: 'name',
            key: 'xoxno',
            state: MarketplaceState.Enable,
            type: MarketplaceTypeEnum.External,
          }),
          new Marketplace({
            address: 'address2',
            name: 'name2',
            key: 'common',
            type: MarketplaceTypeEnum.Internal,
            state: MarketplaceState.Enable,
          }),
          new Marketplace({
            address: 'disabledAddress',
            name: 'name',
            key: 'test',
            type: MarketplaceTypeEnum.External,
            state: MarketplaceState.Disable,
          }),
        ],
        count: 3,
      });

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaces();

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by marketplaceKey and marketplaceAddress returns list with one item', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

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

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

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

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = new CollectionType({
        items: [],
        count: 0,
      });

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = new CollectionType({
        items: [],
        count: 0,
      });

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = new CollectionType({
        items: [],
        count: 0,
      });

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = [
        new Marketplace({
          address: 'address2',
          name: 'name2',
          key: 'common',
          type: MarketplaceTypeEnum.Internal,
        }),
      ];

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getInternalMarketplacesByAddress('address2');

      expect(result).toMatchObject(expectedResult);
    });

    it('when no internal marketplace for specified address returns empty array', async () => {
      const expectedResult = [];
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getInternalMarketplacesByAddress('notFoundAddress');

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getInternalMarketplacesAddreses', () => {
    it('returns list of addresses of internal marketplaces', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      const expectedResult = ['address2'];
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getInternalMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });

    it('when no internal marketplace returns empty array', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      const expectedResult = [];
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      const expectedResult = ['address'];
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getExternalMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });

    it('when no expernal marketplace exists returns empty array', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = [];
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      const expectedResult = ['address', 'address2', 'disabledAddress'];

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });

    it('when no marketplace exists returns empty array', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      const expectedResult = [];
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      const expectedResult = 'address';

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaceAddressByKey('xoxno');

      expect(result).toMatch(expectedResult);
    });

    it('whern searched marketplace doen not exists returns undefied', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      const expectedResult = 'address';

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaceAddressByKey('xoxno');

      expect(result).toMatch(expectedResult);
    });

    it('whern searched marketplace doen not exists returns empty array', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
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
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = new Marketplace({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      });
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );

      const result = await service.getMarketplaceByKey('xoxno');

      expect(result).toMatchObject(expectedResult);
    });

    it('when searched marketplace doen not exists returns empty array', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
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
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = new Marketplace({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      });

      persistenceService.getMarketplaceByAddress = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);
      cacheService.getMarketplaceByAddressAndCollection = jest.fn().mockReturnValueOnce(
        new Marketplace({
          address: 'address2',
          name: 'name2',
          key: 'common',
          type: MarketplaceTypeEnum.Internal,
        }),
      );

      const result = await service.getMarketplaceByType('address', MarketplaceTypeEnum.External);

      expect(result).toMatchObject(expectedResult);
    });

    it('when searched for internal marketplace returns the interl marketplace', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = new Marketplace({
        address: 'address2',
        name: 'name2',
        key: 'common',
        type: MarketplaceTypeEnum.Internal,
      });

      persistenceService.getMarketplaceByAddress = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);

      cacheService.getMarketplaceByAddressAndCollection = jest.fn().mockReturnValueOnce(
        new Marketplace({
          address: 'address2',
          name: 'name2',
          key: 'common',
          type: MarketplaceTypeEnum.Internal,
        }),
      );

      const result = await service.getMarketplaceByType('address2', MarketplaceTypeEnum.Internal, 'collection');

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getMarketplacesFromDb', () => {
    it('returns all marketplaces from db', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      const expectedResult = new CollectionType({
        items: [
          new Marketplace({
            acceptedPaymentIdentifiers: null,
            address: 'address',
            iconUrl: 'https://media.elrond.com/markets/xoxno.svg',
            id: undefined,
            key: 'xoxno',
            lastIndexTimestamp: undefined,
            name: 'name',
            state: MarketplaceState.Enable,
            type: MarketplaceTypeEnum.External,
            url: undefined,
          }),
          new Marketplace({
            acceptedPaymentIdentifiers: null,
            address: 'address2',
            iconUrl: 'https://media.elrond.com/markets/metaspace.svg',
            id: undefined,
            key: 'common',
            lastIndexTimestamp: undefined,
            name: 'name2',
            state: MarketplaceState.Enable,
            type: MarketplaceTypeEnum.Internal,
            url: undefined,
          }),
          new Marketplace({
            acceptedPaymentIdentifiers: null,
            address: 'disabledAddress',
            iconUrl: 'https://media.elrond.com/markets/test.svg',
            id: undefined,
            key: 'test',
            lastIndexTimestamp: undefined,
            name: 'name',
            state: MarketplaceState.Disable,
            type: MarketplaceTypeEnum.External,
            url: undefined,
          }),
        ],
        count: 3,
      });

      persistenceService.getMarketplaces = jest.fn().mockReturnValueOnce([inputMarketplaces, inputCount]);

      const result = await service.getMarketplacesFromDb();

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getMarketplaceByAddressAndCollectionFromDb', () => {
    it('returns marketplace for specified address and collection', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      const expectedResult = new Marketplace({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      });

      persistenceService.getMarketplaceByAddressAndCollection = jest.fn().mockReturnValueOnce([inputMarketplaces[0]]);

      const result = await service.getMarketplaceByAddressAndCollectionFromDb('', '');
      expect(result).toMatchObject(expectedResult);
    });

    it('returns null if no marketplace from keys', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByAddressAndCollection = jest.fn().mockReturnValueOnce([]);

      const result = await service.getMarketplaceByAddressAndCollectionFromDb('', '');

      expect(result).toBeNull();
    });
  });

  describe('getMarketplaceByAddress', () => {
    it('returns marketplace for specified address and collection', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      const expectedResult = new Marketplace({
        address: 'address',
        name: 'name',
        key: 'xoxno',
        type: MarketplaceTypeEnum.External,
      });

      persistenceService.getMarketplaceByAddress = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);

      const result = await service.getMarketplaceByAddress('');
      expect(result).toMatchObject(expectedResult);
    });

    it('returns null if no marketplace from keys', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByAddress = jest.fn().mockReturnValueOnce([]);

      const result = await service.getMarketplaceByAddress('');

      expect(result).toBeNull();
    });
  });

  describe('whitelistCollectionOnMarketplace', () => {
    it('when marketplace not found throws error', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: inputMarketplaces,
          count: inputCount,
        }),
      );
      persistenceService.saveMarketplaceCollection = jest.fn().mockReturnValueOnce(
        new MarketplaceCollectionEntity({
          collectionIdentifier: 'collection',
        }),
      );

      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);

      await expect(service.whitelistCollectionOnMarketplace(new WhitelistCollectionRequest())).rejects.toThrowError(BadRequestError);
    });

    it('when marketplace exists and save fails returns false', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByKeyAndCollection = jest.fn().mockReturnValueOnce(null);
      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);
      persistenceService.saveMarketplaceCollection = jest.fn(() => {
        throw new Error();
      });

      const expectedResult = await service.whitelistCollectionOnMarketplace(new WhitelistCollectionRequest({ marketplaceKey: 'xoxno' }));

      expect(expectedResult).toBeFalsy();
    });

    it('when marketplace exists and save is succesfull returns true', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const eventPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);

      persistenceService.getMarketplaceByKeyAndCollection = jest.fn().mockReturnValueOnce(null);
      eventPublisher.publish = jest.fn();
      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);

      persistenceService.saveMarketplaceCollection = jest.fn().mockReturnValueOnce(
        new MarketplaceCollectionEntity({
          collectionIdentifier: 'collection',
          marketplaces: [inputMarketplaces[0]],
        }),
      );
      const expectedResult = await service.whitelistCollectionOnMarketplace(new WhitelistCollectionRequest({ marketplaceKey: 'xoxno' }));

      expect(expectedResult).toBeTruthy();
    });

    it('when marketplace and collection already whitelisted returns true', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const eventPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);

      persistenceService.getMarketplaceByKeyAndCollection = jest.fn().mockReturnValueOnce(inputMarketplaces);
      eventPublisher.publish = jest.fn();
      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);

      persistenceService.saveMarketplaceCollection = jest.fn().mockReturnValueOnce(
        new MarketplaceCollectionEntity({
          collectionIdentifier: 'collection',
          marketplaces: [inputMarketplaces[0]],
        }),
      );
      const expectedResult = await service.whitelistCollectionOnMarketplace(new WhitelistCollectionRequest({ marketplaceKey: 'xoxno' }));

      expect(expectedResult).toBeTruthy();
    });
  });

  describe('removeWhitelistCollection', () => {
    it('when marketplace not found throws error', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);
      persistenceService.getCollectionByKeyAndCollection = jest.fn().mockReturnValueOnce(new MarketplaceCollectionEntity());

      await expect(service.removeWhitelistCollection(new RemoveWhitelistCollectionRequest())).rejects.toThrowError(BadRequestError);
    });

    it('when collection not found throws error', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);
      persistenceService.getCollectionByKeyAndCollection = jest.fn().mockReturnValueOnce(null);

      await expect(service.removeWhitelistCollection(new RemoveWhitelistCollectionRequest())).rejects.toThrowError(BadRequestError);
    });

    it('when marketplace exists and delete fails returns false', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);
      persistenceService.getCollectionByKeyAndCollection = jest.fn().mockReturnValueOnce(new MarketplaceCollectionEntity());

      persistenceService.deleteMarketplaceCollection = jest.fn(() => {
        throw new Error();
      });

      const expectedResult = await service.removeWhitelistCollection(
        new RemoveWhitelistCollectionRequest({ marketplaceKey: 'xoxno', collection: 'identifier' }),
      );

      expect(expectedResult).toBeFalsy();
    });

    it('when marketplace exists and save is succesfull returns true', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const eventPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);

      eventPublisher.publish = jest.fn();
      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);
      persistenceService.getCollectionByKeyAndCollection = jest.fn().mockReturnValueOnce(new MarketplaceCollectionEntity());

      persistenceService.deleteMarketplaceCollection = jest.fn().mockReturnValueOnce(
        new MarketplaceCollectionEntity({
          collectionIdentifier: 'collection',
          marketplaces: [inputMarketplaces[0]],
        }),
      );
      const expectedResult = await service.removeWhitelistCollection(
        new RemoveWhitelistCollectionRequest({ marketplaceKey: 'xoxno', collection: 'identifier' }),
      );

      expect(expectedResult).toBeTruthy();
    });
  });

  describe('whitelistMarketplace', () => {
    it('when marketplace key exists throws error', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);

      await expect(service.whitelistMarketplace(new WhitelistMarketplaceRequest())).rejects.toThrowError(BadRequestError);
    });

    it('when marketplace key does not exists and save fails returns false', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);
      persistenceService.saveMarketplace = jest.fn(() => {
        throw new Error();
      });

      const expectedResult = await service.whitelistMarketplace(new WhitelistMarketplaceRequest({ marketplaceKey: 'xoxno' }));

      expect(expectedResult).toBeFalsy();
    });

    it('when marketplace key does not exists and save is succesfull returns true', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const eventPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);

      eventPublisher.publish = jest.fn();
      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);

      persistenceService.saveMarketplace = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);
      const expectedResult = await service.whitelistMarketplace(new WhitelistMarketplaceRequest({ marketplaceKey: 'xoxno' }));

      expect(expectedResult).toBeTruthy();
    });
  });

  describe('updateMarketplace', () => {
    it('when marketplace does not exist throws error', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(null);

      await expect(service.updateMarketplace(new WhitelistMarketplaceRequest())).rejects.toThrowError(BadRequestError);
    });

    it('when marketplace exists and save fails returns false', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);
      persistenceService.updateMarketplace = jest.fn(() => {
        throw new Error();
      });

      const expectedResult = await service.updateMarketplace(new UpdateMarketplaceRequest({ marketplaceKey: 'xoxno' }));

      expect(expectedResult).toBeFalsy();
    });

    it('when marketplace does exists and update is succesfull returns true', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const eventPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);

      eventPublisher.publish = jest.fn();
      persistenceService.getMarketplaceByKey = jest.fn().mockReturnValueOnce(inputMarketplaces[0]);

      persistenceService.updateMarketplace = jest.fn().mockReturnValueOnce(true);
      const expectedResult = await service.updateMarketplace(new UpdateMarketplaceRequest({ marketplaceKey: 'xoxno' }));

      expect(expectedResult).toBeTruthy();
    });
  });

  describe('getAllCollectionsIdentifiersFromDb', () => {
    it('returns internal marketplace for address', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      const expectedResult = ['testIdentifier'];

      persistenceService.getAllMarketplaceCollections = jest.fn().mockReturnValueOnce([
        new MarketplaceCollectionEntity({
          collectionIdentifier: 'testIdentifier',
        }),
      ]);

      const result = await service.getAllCollectionsIdentifiersFromDb();

      expect(result).toMatchObject(expectedResult);
    });

    it('when no internal marketplace for specified address returns empty array', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      const expectedResult = [];

      persistenceService.getAllMarketplaceCollections = jest.fn().mockReturnValueOnce([]);

      const result = await service.getAllCollectionsIdentifiersFromDb();
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('disableMarketplace', () => {
    it('when marketplace does not exist throws error', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplacesByAddress = jest.fn().mockReturnValueOnce(null);

      await expect(service.disableMarketplace('address', MarketplaceState.Disable)).rejects.toThrowError(BadRequestError);
    });

    it('when marketplace exists and save fails returns false', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);

      persistenceService.getMarketplacesByAddress = jest.fn().mockReturnValueOnce(inputMarketplaces);
      persistenceService.saveMarketplaces = jest.fn(() => {
        throw new Error();
      });

      const expectedResult = await service.disableMarketplace('address', MarketplaceState.Disable);

      expect(expectedResult).toBeFalsy();
    });

    it('when marketplace does exists and update is succesfull returns true', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const eventPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);

      eventPublisher.publish = jest.fn();
      persistenceService.getMarketplacesByAddress = jest.fn().mockReturnValueOnce(inputMarketplaces);

      persistenceService.saveMarketplaces = jest.fn().mockReturnValueOnce(inputMarketplaces);
      const expectedResult = await service.disableMarketplace('address', MarketplaceState.Disable);

      expect(expectedResult).toBeTruthy();
    });
  });

  describe('enableMarketplace', () => {
    it('when marketplace does not exist throws error', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      persistenceService.getMarketplacesByAddress = jest.fn().mockReturnValueOnce(null);

      await expect(service.enableMarketplace('address', MarketplaceState.Enable)).rejects.toThrowError(BadRequestError);
    });

    it('when marketplace exists and save fails returns false', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const disabledMarketplaceService = module.get<DisabledMarketplaceEventsService>(DisabledMarketplaceEventsService);

      persistenceService.getMarketplacesByAddress = jest.fn().mockReturnValueOnce(inputMarketplaces);
      disabledMarketplaceService.processMissedEventsSinceDisabled = jest.fn(() => {
        throw new Error();
      });

      const expectedResult = await service.enableMarketplace('address', MarketplaceState.Enable);

      expect(expectedResult).toBeFalsy();
    });

    it('when marketplace exists, process succeeds but save fails returns false', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const disabledMarketplaceService = module.get<DisabledMarketplaceEventsService>(DisabledMarketplaceEventsService);

      persistenceService.getMarketplacesByAddress = jest.fn().mockReturnValueOnce(inputMarketplaces);
      disabledMarketplaceService.processMissedEventsSinceDisabled = jest.fn();
      persistenceService.saveMarketplaces = jest.fn(() => {
        throw new Error();
      });

      const expectedResult = await service.enableMarketplace('address', MarketplaceState.Enable);

      expect(expectedResult).toBeFalsy();
    });

    it('when marketplace does exists and update is succesfull returns true', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const eventPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);
      const disabledMarketplaceService = module.get<DisabledMarketplaceEventsService>(DisabledMarketplaceEventsService);

      eventPublisher.publish = jest.fn();
      persistenceService.getMarketplacesByAddress = jest.fn().mockReturnValueOnce(inputMarketplaces);
      persistenceService.saveMarketplaces = jest.fn().mockReturnValueOnce(inputMarketplaces);
      disabledMarketplaceService.processMissedEventsSinceDisabled = jest.fn();
      const expectedResult = await service.disableMarketplace('address', MarketplaceState.Disable);

      expect(expectedResult).toBeTruthy();
    });
  });

  describe('getDisableMarketplacesAddreses', () => {
    it('returns list of addresses of disabled marketplaces', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);
      const expected = ['disabledAddress'];
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: [
            new MarketplaceEntity({
              address: 'address2',
              name: 'name2',
              key: 'common',
              type: MarketplaceTypeEnum.Internal,
              state: MarketplaceState.Enable,
            }),
            new MarketplaceEntity({
              address: 'disabledAddress',
              name: 'name',
              key: 'test',
              type: MarketplaceTypeEnum.External,
              state: MarketplaceState.Disable,
            }),
          ],
          count: 2,
        }),
      );

      const result = await service.getDisabledMarketplacesAddreses();

      expect(result).toMatchObject(expected);
    });

    it('when no expernal marketplace exists returns empty array', async () => {
      const cacheService = module.get<MarketplacesCachingService>(MarketplacesCachingService);

      const expectedResult = [];
      cacheService.getAllMarketplaces = jest.fn().mockReturnValueOnce(
        new CollectionType({
          items: [
            new Marketplace({
              address: 'address',
              name: 'name',
              key: 'xoxno',
              type: MarketplaceTypeEnum.Internal,
              state: MarketplaceState.Enable,
            }),
            new Marketplace({
              address: 'address2',
              name: 'name2',
              key: 'common',
              type: MarketplaceTypeEnum.Internal,
              state: MarketplaceState.Enable,
            }),
          ],
          count: 2,
        }),
      );

      const result = await service.getDisabledMarketplacesAddreses();

      expect(result).toMatchObject(expectedResult);
    });
  });
});
