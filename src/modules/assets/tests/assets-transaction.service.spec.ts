import { Test, TestingModule } from '@nestjs/testing';
import { MxApiService } from 'src/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs';
import { Logger, NotFoundException } from '@nestjs/common';
import { UpdateQuantityRequest } from '../models/requests';
import { AssetsTransactionService } from '../assets-transaction.service';
import { PinataService } from 'src/modules/ipfs/pinata.service';
import { S3Service } from 'src/modules/s3/s3.service';
import { MxStats } from 'src/common/services/mx-communication/models/mx-stats.model';
import { NftTypeEnum } from '../models';

describe('Assets Transaction Service', () => {
  let service: AssetsTransactionService;
  let module: TestingModule;
  const ownerAddress = 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha';

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AssetsTransactionService,
        {
          provide: PinataService,
          useValue: {},
        },
        {
          provide: S3Service,
          useValue: {},
        },
        {
          provide: MxApiService,
          useValue: {},
        },
        {
          provide: RedisCacheService,
          useValue: {},
        },
        {
          provide: Logger,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AssetsTransactionService>(AssetsTransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateQuantity', () => {
    const expectedResult = {
      chainID: 'T',
      data: 'RVNEVE5GVEFkZFF1YW50aXR5QDQ3NDU0ZTJkNjU2NjY2MzUzMTYzQDAzQDBh',
      gasLimit: 200000,
      gasPrice: 1000000000,
      nonce: 0,
      options: undefined,
      receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      signature: undefined,
      value: '0',
      version: 1,
    };

    it('returns built transaction with right arguments', async () => {
      const result = await service.updateQuantity(
        ownerAddress,
        new UpdateQuantityRequest({
          functionName: 'ESDTNFTAddQuantity',
          identifier: 'GEN-eff51c-03',
          quantity: '10',
          updateQuantityRoleAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('burnQuantity', () => {
    const expectedResult = {
      chainID: 'T',
      data: 'RVNEVE5GVFRyYW5zZmVyQDQ3NDU0ZTJkNjU2NjY2MzUzMTYzQDAzQDBhQDZlN2FkNmU3YWQ2ZTdhZDZlN2FkNmU3YWQ2ZTdhZDZlN2FkNmU3YWQ2ZTdhZDZlN2FkNmU3YWQ2ZTdhZDZlN2E=',
      gasLimit: 1000000,
      gasPrice: 1000000000,
      nonce: 0,
      options: undefined,
      receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      signature: undefined,
      value: '0',
      version: 1,
    };

    const burnRequest = new UpdateQuantityRequest({
      functionName: 'ESDTNFTBurn',
      identifier: 'GEN-eff51c-03',
      quantity: '10',
      updateQuantityRoleAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
    });

    it('returns built transaction with right arguments', async () => {
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifier = jest.fn().mockReturnValueOnce({
        type: NftTypeEnum.SemiFungibleESDT,
        balance: 10,
        identifier: 'GEN-8984e7-01',
      });

      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      redisCacheService.getOrSet = jest.fn().mockReturnValueOnce(new MxStats({}));
      const result = await service.burnQuantity(ownerAddress, burnRequest);
      expect(result).toMatchObject(expectedResult);
    });

    it('if no nft for identifier throws expected error', async () => {
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifier = jest.fn().mockReturnValueOnce(null);

      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      redisCacheService.getOrSet = jest
        .fn()
        .mockReturnValueOnce(new MxStats({ epoch: 1105, roundsPassed: 12846, roundsPerEpoch: 14400, refreshRate: 6000 }));

      const result = service.burnQuantity(ownerAddress, burnRequest);
      await expect(result).rejects.toThrowError(new NotFoundException('NFT not found'));
    });

    it('returns burn transaction if after activation epoch', async () => {
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifier = jest.fn().mockReturnValueOnce({
        type: NftTypeEnum.SemiFungibleESDT,
        balance: 10,
        identifier: 'GEN-8984e7-01',
        timestamp: 1628601185,
      });

      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      redisCacheService.getOrSet = jest.fn().mockReturnValueOnce(new MxStats({}));
      const result = await service.burnQuantity(ownerAddress, burnRequest);
      expect(result).toMatchObject(expectedResult);
    });
  });
});
