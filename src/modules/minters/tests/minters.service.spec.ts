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
      const cachingService = module.get<MintersCachingService>(MintersCachingService);
      persistenceService.saveMinter = jest.fn().mockReturnValueOnce(new MinterEntity({ address: 'address', name: 'name' }));

      cachingService.invalidateMinters = jest.fn();

      const result = await service.whitelistMinter(new WhitelistMinterRequest());

      expect(result).toBeTruthy();
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
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MintersCachingService>(MintersCachingService);
      persistenceService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', name: 'name' }),
          new MinterEntity({ address: 'address2', name: 'name2' }),
        ]);

      cachingService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', name: 'name' }),
          new MinterEntity({ address: 'address2', name: 'name2' }),
        ]);

      const result = await service.getMinters();
      const expectedResult = [new Minter({ address: 'address', name: 'name' }), new Minter({ address: 'address2', name: 'name2' })];

      expect(result).toMatchObject(expectedResult);
    });

    it('when filters by address returns only one minter', async () => {
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MintersCachingService>(MintersCachingService);
      persistenceService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', name: 'name' }),
          new MinterEntity({ address: 'address2', name: 'name2' }),
        ]);

      cachingService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', name: 'name' }),
          new MinterEntity({ address: 'address2', name: 'name2' }),
        ]);

      const result = await service.getMinters(new MinterFilters({ minterAddress: 'address' }));
      const expectedResult = [new Minter({ address: 'address', name: 'name' })];

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
      const persistenceService = module.get<PersistenceService>(PersistenceService);
      const cachingService = module.get<MintersCachingService>(MintersCachingService);
      persistenceService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', name: 'name' }),
          new MinterEntity({ address: 'address2', name: 'name2' }),
        ]);

      cachingService.getMinters = jest
        .fn()
        .mockReturnValueOnce([
          new MinterEntity({ address: 'address', name: 'name' }),
          new MinterEntity({ address: 'address2', name: 'name2' }),
        ]);

      const result = await service.getMintersAddresses();
      const expectedResult = ['address', 'address2'];

      expect(result).toMatchObject(expectedResult);
    });
  });
});
