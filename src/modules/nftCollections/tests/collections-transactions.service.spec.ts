import { Test, TestingModule } from '@nestjs/testing';
import { IssueCollectionRequest, SetNftRolesRequest, StopNftCreateRequest, TransferNftCreateRoleRequest } from '../models/requests';
import { CollectionsTransactionsService } from '../collections-transactions.service';

describe('Collections Transactions Service', () => {
  let service: CollectionsTransactionsService;
  let module: TestingModule;
  const ownerAddress = 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha';

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [CollectionsTransactionsService],
    }).compile();

    service = module.get<CollectionsTransactionsService>(CollectionsTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueToken', () => {
    it('returns built transaction for issue non fungible with right arguments', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'aXNzdWVOb25GdW5naWJsZUA0ZTYxNmQ2NTczQDRlNDE0ZDQ1QDYzNjE2ZTQ2NzI2NTY1N2E2NUA3NDcyNzU2NUA2MzYxNmU1MDYxNzU3MzY1QDc0NzI3NTY1QDYzNjE2ZTU0NzI2MTZlNzM2NjY1NzI0ZTQ2NTQ0MzcyNjU2MTc0NjU1MjZmNmM2NUA3NDcyNzU2NQ==',
        gasLimit: 60000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '50000000000000000',
        version: 2,
      };

      const result = await service.issueToken(
        ownerAddress,
        new IssueCollectionRequest({
          tokenName: 'Names',
          tokenTicker: 'NAME',
          canFreeze: true,
          canPause: true,
          canTransferNFTCreateRole: true,
          collectionType: 'issueNonFungible',
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });

    it('returns built transaction for issue semi fungible with right arguments', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'aXNzdWVTZW1pRnVuZ2libGVANGU2MTZkNjU3M0A0ZTQxNGQ0NUA2MzYxNmU0NjcyNjU2NTdhNjVANzQ3Mjc1NjVANjM2MTZlNTA2MTc1NzM2NUA3NDcyNzU2NUA2MzYxNmU1NDcyNjE2ZTczNjY2NTcyNGU0NjU0NDM3MjY1NjE3NDY1NTI2ZjZjNjVANzQ3Mjc1NjU=',
        gasLimit: 60000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '50000000000000000',
        version: 2,
      };

      const result = await service.issueToken(
        ownerAddress,
        new IssueCollectionRequest({
          tokenName: 'Names',
          tokenTicker: 'NAME',
          canFreeze: true,
          canPause: true,
          canTransferNFTCreateRole: true,
          collectionType: 'issueSemiFungible',
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('stopNFTCreate', () => {
    it('returns built transaction with right arguments', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'c3RvcE5GVENyZWF0ZUA2MzZmNmM2YzY1NjM3NDY5NmY2ZQ==',
        gasLimit: 60000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.stopNFTCreate(
        ownerAddress,
        new StopNftCreateRequest({
          ownerAddress: ownerAddress,
          collection: 'collection',
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('transferNFTCreateRole', () => {
    it('returns built transaction with right arguments', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'dHJhbnNmZXJORlRDcmVhdGVSb2xlQDYzNmY2YzZjNjU2Mzc0Njk2ZjZlQGY5ZjRlNWMzN2I4Yjg2Mjg5ZTgyMDY5OTA1OTBjNjYxODRhZWM2NzY5NjYyOTQyYzFiYjZkZTRkOWFhYWQwMmI=',
        gasLimit: 60000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.transferNFTCreateRole(
        ownerAddress,
        new TransferNftCreateRoleRequest({
          ownerAddress: ownerAddress,
          collection: 'collection',
          addressToTransferList: ['erd1l86wtsmm3wrz385zq6vstyxxvxz2a3nkje3fgtqmkm0ymx426q4s93gyd9'],
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('setNftRoles', () => {
    it('returns built transaction with right arguments', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'c2V0U3BlY2lhbFJvbGVANjM2ZjZjNmM2NTYzNzQ2OTZmNmVAZjlmNGU1YzM3YjhiODYyODllODIwNjk5MDU5MGM2NjE4NGFlYzY3Njk2NjI5NDJjMWJiNmRlNGQ5YWFhZDAyYkA1NDY1NzM3NA==',
        gasLimit: 60000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.setNftRoles(
        ownerAddress,
        new SetNftRolesRequest({
          collection: 'collection',
          addressToTransfer: 'erd1l86wtsmm3wrz385zq6vstyxxvxz2a3nkje3fgtqmkm0ymx426q4s93gyd9',
          roles: ['Test'],
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });
  });
});
