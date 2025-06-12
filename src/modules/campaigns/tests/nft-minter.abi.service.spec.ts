import { Test, TestingModule } from '@nestjs/testing';
import { MxApiService } from 'src/common';
import { MediaMimeTypeEnum } from 'src/modules/assets/models/MediaTypes.enum';
import { BuyRequest, IssueCampaignRequest, TierRequest } from '../models/requests';
import { UpgradeNftRequest } from '../models/requests/UpgradeNftRequest ';
import { NftMinterAbiService } from '../nft-minter.abi.service';

describe('Nft Minter Abi Service', () => {
  let service: NftMinterAbiService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        NftMinterAbiService,
        {
          provide: MxApiService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<NftMinterAbiService>(NftMinterAbiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('issueToken', () => {
    it('returns build transaction with right arguments', async () => {
      const result = await service.issueToken(
        new IssueCampaignRequest({
          collectionIpfsHash: 'hash',
          campaignId: 'campaignId',
          mediaTypes: MediaMimeTypeEnum.png,
          royalties: '1000',
          mintStartTime: 12324232,
          mintEndTime: 121211212,
          whitelistEndTime: 12121212,
          mintPriceToken: 'EGLD',
          collectionName: 'Name',
          collectionTicker: 'NAME',
          tags: ['tag'],
          tiers: [new TierRequest({ totalNfts: 100, mintPriceAmount: '100000000', tierName: 'tierName' })],
          minterAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
          ownerAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        }),
      );

      const expectedResult = {
        chainID: 'T',
        data: 'aXNzdWVUb2tlbkZvckJyYW5kQDY4NjE3MzY4QDYzNjE2ZDcwNjE2OTY3NmU0OTY0QDcwNmU2N0AwM2U4QGJjMGQ4OEAwNzM5ODk0Y0A0NTQ3NGM0NEA0ZTYxNmQ2NUA0ZTQxNGQ0NUBiOGY0N2NAMDAwMDAwMDM3NDYxNjdANzQ2OTY1NzI0ZTYxNmQ2NUA2NEAwNWY1ZTEwMA==',
        gasLimit: 70000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '50000000000000000',
        version: 2,
      };
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('buyRandomNft', () => {
    it('returns build transaction with right arguments', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'YnV5UmFuZG9tTmZ0QDYzNjE2ZDcwNjE2OTY3NmVANzQ2OTY1NzJAMGM=',
        gasLimit: 144000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgq7t389h9twftwlnt29hm0xz58v7k3vt6fpltqhtxnru',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '10000000',
        version: 2,
      };

      const result = await service.buyRandomNft(
        'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        new BuyRequest({
          campaignId: 'campaign',
          tier: 'tier',
          minterAddress: 'erd1qqqqqqqqqqqqqpgq7t389h9twftwlnt29hm0xz58v7k3vt6fpltqhtxnru',
          price: '10000000',
          quantity: '12',
        }),
      );

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('upgradeNft', () => {
    it('returns build transaction with right arguments', async () => {
      const result = await service.upgradeNft(
        'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        new UpgradeNftRequest({
          campaignId: 'campaignId',
          identifier: 'CAMP-3bd1c7-01',
          minterAddress: 'erd1qqqqqqqqqqqqqpgq7t389h9twftwlnt29hm0xz58v7k3vt6fpltqhtxnru',
        }),
      );
      const expectedResult = {
        chainID: 'T',
        data: 'RVNEVE5GVFRyYW5zZmVyQDQzNDE0ZDUwMmQzMzYyNjQzMTYzMzdAMDFAMDFAMDAwMDAwMDAwMDAwMDAwMDA1MDBmMmUyNzJkY2FiNzI1NmVmY2Q2YTJkZjZmMzBhODc2N2FkMTYyZjQ5MGZkNkA2ZTY2NzQ1NTcwNjc3MjYxNjQ2NUA2MzYxNmQ3MDYxNjk2NzZlNDk2NA==',
        gasLimit: 13000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      expect(result).toMatchObject(expectedResult);
    });
  });
});
