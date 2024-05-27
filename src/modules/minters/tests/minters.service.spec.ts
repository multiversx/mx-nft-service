import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { MintersService } from '../minters.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { MintersCachingService } from '../minters-caching.service';
import { UnableToLoadError } from 'src/common/models/errors/unable-to-load-error';
import { MinterEntity } from 'src/db/minters';
import { Minter } from '../models';
import { WhitelistMinterRequest } from '../models/requests/whitelistMinterRequest';
import { MinterFilters } from '../models/MinterFilters';
import { MintersDeployerAbiService } from '../minters-deployer.abi.service';
import { CacheEventsPublisherService } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';

describe('Minters Service', () => {
  let service: MintersService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        MintersService,
        {
          provide: Logger,
          useValue: {
            error: jest.fn().mockImplementation(() => {}),
          },
        },
        {
          provide: MintersCachingService,
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

    service = module.get<MintersService>(MintersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('whitelistMinter', () => {
    it('throws error when input data not in correct format', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      persistenceService.saveMinter = jest.fn(() => {
        throw new Error();
      });
      await expect(service.whitelistMinter(new WhitelistMinterRequest())).rejects.toThrowError(UnableToLoadError);
    });

    it('when saves succed returns true', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const cacheEventsPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);
      persistenceService.saveMinter = jest.fn().mockReturnValueOnce(new MinterEntity({ address: 'address' }));

      cacheEventsPublisher.publish = jest.fn();

      const result = await service.whitelistMinter(new WhitelistMinterRequest({ address: 'address' }));

      expect(result).toBeTruthy();
    });

    it('when minter address in the expected list but save fails returns false', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const cacheEventsPublisher = module.get<CacheEventsPublisherService>(CacheEventsPublisherService);
      persistenceService.saveMinter = jest.fn().mockReturnValueOnce(null);

      cacheEventsPublisher.publish = jest.fn();

      const result = await service.whitelistMinter(new WhitelistMinterRequest({ address: 'address' }));

      expect(result).toBeFalsy();
    });
  });

  describe('getMinters', () => {
    it('when database layer throws error returns empty array', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      persistenceService.getMinters = jest.fn(() => {
        throw new Error();
      });
      const response = await service.getMinters();
      expect(response).toMatchObject([]);
    });

    it('when repo returns value returns expected response', async () => {
      const cacheService = module.get<MintersCachingService>(MintersCachingService);

      cacheService.getMinters = jest
        .fn()
        .mockReturnValueOnce([new MinterEntity({ address: 'address' }), new MinterEntity({ address: 'address2' })]);
      const result = await service.getMinters();
      const expectedResult = [new Minter({ address: 'address' }), new Minter({ address: 'address2' })];

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by minterAddress returns only one minter', async () => {
      const cacheService = module.get<MintersCachingService>(MintersCachingService);

      cacheService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', adminAddress: 'adminAddr' }),
          new MinterEntity({ address: 'address2', adminAddress: 'adminAddr2' }),
        ]);
      const result = await service.getMinters(new MinterFilters({ minterAddress: 'address' }));
      const expectedResult = [new Minter({ address: 'address', adminAddress: 'adminAddr' })];

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by minterAdminAddress returns only one minter', async () => {
      const cacheService = module.get<MintersCachingService>(MintersCachingService);

      cacheService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', adminAddress: 'adminAddr' }),
          new MinterEntity({ address: 'address2', adminAddress: 'adminAddr2' }),
        ]);
      const result = await service.getMinters(new MinterFilters({ minterAdminAddress: 'adminAddr' }));
      const expectedResult = [new Minter({ address: 'address', adminAddress: 'adminAddr' })];

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by minterAdminAddress returns all minters for that owner', async () => {
      const cacheService = module.get<MintersCachingService>(MintersCachingService);

      cacheService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', adminAddress: 'adminAddr' }),
          new MinterEntity({ address: 'address2', adminAddress: 'adminAddr' }),
        ]);

      const result = await service.getMinters(new MinterFilters({ minterAdminAddress: 'adminAddr' }));
      const expectedResult = [
        new Minter({ address: 'address', adminAddress: 'adminAddr' }),
        new Minter({ address: 'address2', adminAddress: 'adminAddr' }),
      ];

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('getMintersAddresses', () => {
    it('when database layer throws error returns empty array', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      persistenceService.getMinters = jest.fn(() => {
        throw new Error();
      });
      const response = await service.getMinters();
      expect(response).toMatchObject([]);
    });

    it('when repo returns value returns addresses', async () => {
      const cacheService = module.get<MintersCachingService>(MintersCachingService);

      cacheService.getMinters = jest
        .fn()
        .mockReturnValueOnce([new MinterEntity({ address: 'address' }), new MinterEntity({ address: 'address2' })]);

      const result = await service.getMintersAddresses();
      const expectedResult = ['address', 'address2'];

      expect(result).toMatchObject(expectedResult);
    });
  });
});
