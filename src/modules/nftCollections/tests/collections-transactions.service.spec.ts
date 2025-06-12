import { Test, TestingModule } from '@nestjs/testing';
import { MxApiService } from 'src/common';
import { NftTypeEnum } from 'src/modules/assets/models';
import { CollectionsTransactionsService } from '../collections-transactions.service';
import { IssueCollectionRequest, SetNftRolesRequest } from '../models/requests';

describe('Collections Transactions Service', () => {
  let service: CollectionsTransactionsService;
  let module: TestingModule;
  const ownerAddress = 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha';

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        CollectionsTransactionsService,
        {
          provide: MxApiService,
          useValue: {},
        },
      ],
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
        data: 'aXNzdWVOb25GdW5naWJsZUA0ZTYxNmQ2NTczQDRlNDE0ZDQ1QDYzNjE2ZTQ2NzI2NTY1N2E2NUA3NDcyNzU2NUA2MzYxNmU1NzY5NzA2NUA2NjYxNmM3MzY1QDYzNjE2ZTUwNjE3NTczNjVANzQ3Mjc1NjVANjM2MTZlNTQ3MjYxNmU3MzY2NjU3MjRlNDY1NDQzNzI2NTYxNzQ2NTUyNmY2YzY1QDc0NzI3NTY1QDYzNjE2ZTQzNjg2MTZlNjc2NTRmNzc2ZTY1NzJANjY2MTZjNzM2NUA2MzYxNmU1NTcwNjc3MjYxNjQ2NUA3NDcyNzU2NUA2MzYxNmU0MTY0NjQ1MzcwNjU2MzY5NjE2YzUyNmY2YzY1NzNANzQ3Mjc1NjU=',
        gasLimit: 60485000,
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
        data: 'aXNzdWVTZW1pRnVuZ2libGVANGU2MTZkNjU3M0A0ZTQxNGQ0NUA2MzYxNmU0NjcyNjU2NTdhNjVANzQ3Mjc1NjVANjM2MTZlNTc2OTcwNjVANjY2MTZjNzM2NUA2MzYxNmU1MDYxNzU3MzY1QDc0NzI3NTY1QDYzNjE2ZTU0NzI2MTZlNzM2NjY1NzI0ZTQ2NTQ0MzcyNjU2MTc0NjU1MjZmNmM2NUA3NDcyNzU2NUA2MzYxNmU0MzY4NjE2ZTY3NjU0Zjc3NmU2NTcyQDY2NjE2YzczNjVANjM2MTZlNTU3MDY3NzI2MTY0NjVANzQ3Mjc1NjVANjM2MTZlNDE2NDY0NTM3MDY1NjM2OTYxNmM1MjZmNmM2NTczQDc0NzI3NTY1',
        gasLimit: 60486500,
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

  describe('setNftRoles', () => {
    it('returns built transaction with right arguments', async () => {
      const apiService = module.get<MxApiService>(MxApiService);
      apiService.getCollectionForIdentifier = jest.fn().mockReturnValueOnce({
        type: NftTypeEnum.SemiFungibleESDT,
        balance: 10,
        collection: 'GEN-8984e7',
        timestamp: 1738851204,
      });
      const expectedResult = {
        chainID: 'T',
        data: 'c2V0U3BlY2lhbFJvbGVANjM2ZjZjNmM2NTYzNzQ2OTZmNmVANmUyMjQxMThkOTA2OGFlNjI2ODc4YTFjZmJlYmNiNmE5NWE0NzE1ZGI4NmQxYjUxZTA2YTA0MjI2Y2YzMGZkNkA0NTUzNDQ1NDUyNmY2YzY1NGU0NjU0NDE2NDY0NTE3NTYxNmU3NDY5NzQ3OQ==',
        gasLimit: 60267500,
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
          roles: ['ESDTRoleNFTAddQuantity'],
        }),
      );
      expect(result).toMatchObject(expectedResult);
    });
  });
});
