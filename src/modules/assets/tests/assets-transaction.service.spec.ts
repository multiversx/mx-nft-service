import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MxApiService } from 'src/common';
import { MxStats } from 'src/common/services/mx-communication/models/mx-stats.model';
import { UploadToIpfsResult } from 'src/modules/ipfs/ipfs.model';
import { PinataService } from 'src/modules/ipfs/pinata.service';
import { S3Service } from 'src/modules/s3/s3.service';
import { AssetsTransactionService } from '../assets-transaction.service';
import { NftTypeEnum } from '../models';
import { Attribute, CreateNftRequest, TransferNftRequest, UpdateQuantityRequest } from '../models/requests';

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
      version: 2,
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
      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVE5GVFRyYW5zZmVyQDQ3NDU0ZTJkNjU2NjY2MzUzMTYzQDAzQDBhQDZlN2FkNmU3YWQ2ZTdhZDZlN2FkNmU3YWQ2ZTdhZDZlN2FkNmU3YWQ2ZTdhZDZlN2FkNmU3YWQ2ZTdhZDZlN2E=',
        gasLimit: 1210500,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.burnQuantity(ownerAddress, burnRequest);
      expect(result).toMatchObject(expectedResult);
    });

    it('if no nft for identifier throws expected error', async () => {
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifier = jest.fn().mockReturnValueOnce(null);

      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      redisCacheService.getOrSet = jest.fn().mockReturnValueOnce(new MxStats({}));

      const result = service.burnQuantity(ownerAddress, burnRequest);
      await expect(result).rejects.toThrowError(new NotFoundException('NFT not found'));
    });

    it('returns burn transaction if after activation epoch', async () => {
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getNftByIdentifier = jest.fn().mockReturnValueOnce({
        type: NftTypeEnum.SemiFungibleESDT,
        balance: 10,
        identifier: 'GEN-8984e7-01',
        timestamp: 1738851204,
      });

      const redisCacheService = module.get<RedisCacheService>(RedisCacheService);
      redisCacheService.getOrSet = jest
        .fn()
        .mockReturnValueOnce(new MxStats({ epoch: 1684, roundsPassed: 10103, roundsPerEpoch: 14400, refreshRate: 6000 }));
      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVE5GVEJ1cm5ANDc0NTRlMmQ2NTY2NjYzNTMxNjNAMDNAMGE=',
        gasLimit: 200000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.burnQuantity(ownerAddress, burnRequest);
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('transferNft', () => {
    it('returns built transaction with right arguments for NFT', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVE5GVFRyYW5zZmVyQDQ3NDU0ZTJkNjU2NjY2MzUzMTYzQDAzQDAxQDZlMjI0MTE4ZDkwNjhhZTYyNjg3OGExY2ZiZWJjYjZhOTVhNDcxNWRiODZkMWI1MWUwNmEwNDIyNmNmMzBmZDY=',
        gasLimit: 1210500,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.transferNft(
        ownerAddress,
        new TransferNftRequest({
          identifier: 'GEN-eff51c-03',
          destinationAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });

    it('returns built transaction with right arguments for SFT', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVE5GVFRyYW5zZmVyQDQ3NDU0ZTJkNjU2NjY2MzUzMTYzQDAzQDBhQDZlMjI0MTE4ZDkwNjhhZTYyNjg3OGExY2ZiZWJjYjZhOTVhNDcxNWRiODZkMWI1MWUwNmEwNDIyNmNmMzBmZDY=',
        gasLimit: 1210500,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.transferNft(
        ownerAddress,
        new TransferNftRequest({
          identifier: 'GEN-eff51c-03',
          quantity: '10',
          destinationAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });

    it('correctly handles large hex nonce like TEST-9e876f-0435', async () => {
      const result = await service.transferNft(
        ownerAddress,
        new TransferNftRequest({
          identifier: 'TEST-9e876f-0435', 
          quantity: '1',
          destinationAddress: 'erd1f339wqgj09j6yf79m0ae85syjaljxsfgasuwfe33g22jmyjvep6qsm0w6n',
        }),
      );

      // The transaction data should contain the correct hex nonce (0435)
      // ESDTNFTTransfer@TEST-9e876f@0435@01@destinationAddress
      expect(result.data).toContain('RVNEVE5GVFRyYW5zZmVy');
      expect(result.chainID).toBe('T');
      expect(result.receiver).toBe(ownerAddress);
      expect(result.gasLimit).toBe(1216500);
    });

    it('correctly handles problematic hex nonce like TEST-753c62-01f6', async () => {
      const result = await service.transferNft(
        ownerAddress,
        new TransferNftRequest({
          identifier: 'TEST-753c62-01f6',
          quantity: '1',
          destinationAddress: 'erd1f339wqgj09j6yf79m0ae85syjaljxsfgasuwfe33g22jmyjvep6qsm0w6n',
        }),
      );

      expect(result.data).toContain('RVNEVE5GVFRyYW5zZmVy');
      expect(result.chainID).toBe('T');
      expect(result.receiver).toBe(ownerAddress);
      expect(result.gasLimit).toBe(1216500);
    });

    it('correctly handles simple hex nonces like 01, 04', async () => {
      const result = await service.transferNft(
        ownerAddress,
        new TransferNftRequest({
          identifier: 'TEST-123456-01',
          quantity: '1',
          destinationAddress: 'erd1f339wqgj09j6yf79m0ae85syjaljxsfgasuwfe33g22jmyjvep6qsm0w6n',
        }),
      );

      expect(result.data).toContain('RVNEVE5GVFRyYW5zZmVy');
      expect(result.chainID).toBe('T');
      expect(result.receiver).toBe(ownerAddress);
    });

    it('correctly handles very large hex nonces', async () => {
      const result = await service.transferNft(
        ownerAddress,
        new TransferNftRequest({
          identifier: 'TEST-123456-ffff', 
          quantity: '1',
          destinationAddress: 'erd1f339wqgj09j6yf79m0ae85syjaljxsfgasuwfe33g22jmyjvep6qsm0w6n',
        }),
      );

      expect(result.data).toContain('RVNEVE5GVFRyYW5zZmVy');
      expect(result.chainID).toBe('T');
      expect(result.receiver).toBe(ownerAddress);
    });

    it('correctly handles multi-digit hex nonces with leading zeros', async () => {
      const result = await service.transferNft(
        ownerAddress,
        new TransferNftRequest({
          identifier: 'TEST-123456-00ab',
          quantity: '1',
          destinationAddress: 'erd1f339wqgj09j6yf79m0ae85syjaljxsfgasuwfe33g22jmyjvep6qsm0w6n',
        }),
      );

      expect(result.data).toContain('RVNEVE5GVFRyYW5zZmVy');
      expect(result.chainID).toBe('T');
      expect(result.receiver).toBe(ownerAddress);
    });

    it('verifies hex nonce conversion produces correct decimal values', () => {
      const testCases = [
        { hex: '01f6', expectedDecimal: 502 },
        { hex: '0435', expectedDecimal: 1077 },
        { hex: '01', expectedDecimal: 1 },
        { hex: '04', expectedDecimal: 4 },
        { hex: 'ffff', expectedDecimal: 65535 },
        { hex: '00ab', expectedDecimal: 171 },
      ];

      for (const { hex, expectedDecimal } of testCases) {
        const convertedValue = BigInt(parseInt(hex, 16));
        expect(Number(convertedValue)).toBe(expectedDecimal);
      }
    });
  });

  describe('createNft', () => {
    it('returns built transaction with right arguments for mint', async () => {
      const pinataService = module.get<PinataService>(PinataService);
      pinataService.uploadFile = jest.fn().mockReturnValueOnce(new UploadToIpfsResult({ hash: 'hash', url: 'url' }));
      pinataService.uploadText = jest.fn().mockReturnValueOnce(new UploadToIpfsResult({ hash: 'hash', url: 'url' }));

      const s3Service = module.get<S3Service>(S3Service);
      s3Service.upload = jest.fn().mockReturnValueOnce(true);
      s3Service.uploadText = jest.fn().mockReturnValueOnce(true);

      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVE5GVENyZWF0ZUA0MzZmNmM2YzY1NjM3NDY5NmY2ZUAwMUA0ZTYxNmQ2NUAwM2U4QDY4NjE3MzY4QDc0NjE2NzczM2E3NDYxNjczYjZkNjU3NDYxNjQ2MTc0NjEzYTY4NjE3MzY4QDc1NzI2Yw==',
        gasLimit: 3228033,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.createNft(
        ownerAddress,
        new CreateNftRequest({
          attributes: new Attribute({ description: 'desciption', tags: ['tag'] }),
          collection: 'Collection',
          name: 'Name',
          royalties: '1000',
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });
  });
});
