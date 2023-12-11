import { Test, TestingModule } from '@nestjs/testing';
import { DeployMinterRequest, UpgradeMinterRequest } from '../models/requests/DeployMinterRequest';
import { MxProxyService } from 'src/common';
import { ProxyDeployerAbiService } from '../proxy-deployer.abi.service';

describe('Proxy  Deployer Abi Service', () => {
  let service: ProxyDeployerAbiService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ProxyDeployerAbiService,
        {
          provide: MxProxyService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProxyDeployerAbiService>(ProxyDeployerAbiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deployMinterSc', () => {
    it('returns built transaction with right arguments', async () => {
      const result = await service.deployMinterSc(
        new DeployMinterRequest({
          maxNftsPerTransaction: 4,
          mintClaimAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
          royaltiesClaimAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
          ownerAddress: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        }),
      );

      const expectedResult = {
        chainID: 'T',
        data: 'Y29udHJhY3REZXBsb3lAMDAwMDAwMDAwMDAwMDAwMDA1MDAxNDIyNDdiMDc1NWQ2MDAyNjU3MTUyZjUyMDk3NjdhN2UzN2Y4Y2IxZTNkZkA2ZTIyNDExOGQ5MDY4YWU2MjY4NzhhMWNmYmViY2I2YTk1YTQ3MTVkYjg2ZDFiNTFlMDZhMDQyMjZjZjMwZmQ2QDZlMjI0MTE4ZDkwNjhhZTYyNjg3OGExY2ZiZWJjYjZhOTVhNDcxNWRiODZkMWI1MWUwNmEwNDIyNmNmMzBmZDZAMDRANmUyMjQxMThkOTA2OGFlNjI2ODc4YTFjZmJlYmNiNmE5NWE0NzE1ZGI4NmQxYjUxZTA2YTA0MjI2Y2YzMGZkNg==',
        gasLimit: 70000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 1,
      };
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('deployBulkSc', () => {
    it('returns built transaction with right arguments', async () => {
      const result = await service.deployBulkSc('erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha');

      const expectedResult = {
        chainID: 'T',
        data: 'Y29udHJhY3REZXBsb3lAMDAwMDAwMDAwMDAwMDAwMDA1MDAxNDIyNDdiMDc1NWQ2MDAyNjU3MTUyZjUyMDk3NjdhN2UzN2Y4Y2IxZTNkZkA2ZTIyNDExOGQ5MDY4YWU2MjY4NzhhMWNmYmViY2I2YTk1YTQ3MTVkYjg2ZDFiNTFlMDZhMDQyMjZjZjMwZmQ2',
        gasLimit: 70000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 1,
      };
      expect(result).toMatchObject(expectedResult);
    });
  });

  describe('deployMarketplaceSc', () => {
    it('returns built transaction with right arguments', async () => {
      const result = await service.deployMarketplaceSc('erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha', '10000');

      const expectedResult = {
        chainID: 'T',
        data: 'Y29udHJhY3REZXBsb3lAMDAwMDAwMDAwMDAwMDAwMDA1MDAyZjcwNTEzMzE1ZTIwNDM0MDNhMDkwMTEyNmRkODYzMmNkZTc3MTU5ZTNkZg==',
        gasLimit: 70000000,
        gasPrice: 1000000000,
        nonce: 0,
        options: undefined,
        receiver: 'erd1qqqqqqqqqqqqqpgqut6lamz9dn480ytj8cmcwvydcu3lj55epltq9t9kam',
        sender: 'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
        signature: undefined,
        value: '0',
        version: 1,
      };
      expect(result).toMatchObject(expectedResult);
    });
  });
});
