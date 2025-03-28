import { Test, TestingModule } from '@nestjs/testing';
import { MxApiService } from 'src/common';
import { MintersDeployerAbiService } from '../minters-deployer.abi.service';
import { DeployMinterRequest, UpgradeMinterRequest } from '../models/requests/DeployMinterRequest';

describe('Minters Deployer Abi Service', () => {
  let service: MintersDeployerAbiService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        MintersDeployerAbiService,
        {
          provide: MxApiService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<MintersDeployerAbiService>(MintersDeployerAbiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deployMinter', () => {
    it('returns build transaction with right arguments', async () => {
      const result = await service.deployMinter(
        new DeployMinterRequest({
          maxNftsPerTransaction: 4,
          mintClaimAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
          royaltiesClaimAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
          ownerAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        }),
      );

      const expectedResult = {
        chainID: 'T',
        data: 'Y3JlYXRlTmZ0TWludGVyQDZlMjI0MTE4ZDkwNjhhZTYyNjg3OGExY2ZiZWJjYjZhOTVhNDcxNWRiODZkMWI1MWUwNmEwNDIyNmNmMzBmZDZANmUyMjQxMThkOTA2OGFlNjI2ODc4YTFjZmJlYmNiNmE5NWE0NzE1ZGI4NmQxYjUxZTA2YTA0MjI2Y2YzMGZkNkAwNA==',
        gasLimit: 70000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('pauseNftMinter', () => {
    it('returns build transaction with right arguments', async () => {
      const expectedResult = {
        chainID: 'T',
        data: 'cGF1c2VOZnRNaW50ZXJAMDAwMDAwMDAwMDAwMDAwMDA1MDBmMmUyNzJkY2FiNzI1NmVmY2Q2YTJkZjZmMzBhODc2N2FkMTYyZjQ5MGZkNg==',
        gasLimit: 70000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      const result = await service.pauseNftMinter(
        'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        new UpgradeMinterRequest({ minterAddress: 'erd1qqqqqqqqqqqqqpgq7t389h9twftwlnt29hm0xz58v7k3vt6fpltqhtxnru' }),
      );

      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('resumeNftMinter', () => {
    it('returns build transaction with right arguments', async () => {
      const result = await service.resumeNftMinter(
        'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        new UpgradeMinterRequest({ minterAddress: 'erd1qqqqqqqqqqqqqpgq7t389h9twftwlnt29hm0xz58v7k3vt6fpltqhtxnru' }),
      );
      const expectedResult = {
        chainID: 'T',
        data: 'cmVzdW1lTmZ0TWludGVyQDAwMDAwMDAwMDAwMDAwMDAwNTAwZjJlMjcyZGNhYjcyNTZlZmNkNmEyZGY2ZjMwYTg3NjdhZDE2MmY0OTBmZDY=',
        gasLimit: 70000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 2,
      };

      expect(result).toMatchObject(expectedResult);
    });
  });
});
