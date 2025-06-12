import { Address, AddressValue, SmartContractController, SmartContractQuery, U32Value } from '@multiversx/sdk-core';
import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { gas } from 'src/config';
import { ContractLoader } from '../auctions/contractLoader';
import { MarketplaceUtils } from '../auctions/marketplaceUtils';
import { TransactionNode } from '../common/transaction';
import { DeployMinterRequest, UpgradeMinterRequest } from './models/requests/DeployMinterRequest';

@Injectable()
export class MintersDeployerAbiService {
  constructor(private mxApiService: MxApiService) {}
  async deployMinter(request: DeployMinterRequest): Promise<TransactionNode> {
    const factory = await ContractLoader.getFactory(MarketplaceUtils.deployerMintersAbiPath);
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(request.ownerAddress), {
      contract: Address.newFromBech32(process.env.DEPLOYER_ADDRESS),
      function: 'createNftMinter',
      gasLimit: gas.deployMinter,
      arguments: [
        new AddressValue(Address.newFromBech32(request.royaltiesClaimAddress)),
        new AddressValue(Address.newFromBech32(request.mintClaimAddress)),
        new U32Value(request.maxNftsPerTransaction),
      ],
    });
    return transaction.toPlainObject();
  }

  async pauseNftMinter(ownerAddress: string, request: UpgradeMinterRequest): Promise<TransactionNode> {
    const factory = await ContractLoader.getFactory(MarketplaceUtils.deployerMintersAbiPath);
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(process.env.DEPLOYER_ADDRESS),
      function: 'pauseNftMinter',
      gasLimit: gas.deployMinter,
      arguments: [new AddressValue(Address.newFromBech32(request.minterAddress))],
    });
    return transaction.toPlainObject();
  }

  async resumeNftMinter(ownerAddress: string, request: UpgradeMinterRequest): Promise<TransactionNode> {
    const factory = await ContractLoader.getFactory(MarketplaceUtils.deployerMintersAbiPath);
    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(process.env.DEPLOYER_ADDRESS),
      function: 'resumeNftMinter',
      gasLimit: gas.deployMinter,
      arguments: [new AddressValue(new Address(request.minterAddress))],
    });
    return transaction.toPlainObject();
  }

  public async getMintersForAddress(address: string): Promise<string[]> {
    const controller: SmartContractController = await ContractLoader.getController(
      this.mxApiService.getService(),
      MarketplaceUtils.deployerMintersAbiPath,
    );

    const getDataQuery = await controller.runQuery(
      new SmartContractQuery({
        contract: Address.newFromBech32(process.env.DEPLOYER_ADDRESS),
        function: 'getUserNftMinterContracts',
        arguments: [new Uint8Array(Buffer.from(new AddressValue(Address.newFromBech32(address)).toString()))],
      }),
    );

    const [response] = controller.parseQueryResponse(getDataQuery);

    const contractAddresses: AddressValue[] = response.valueOf().toFixed();

    return contractAddresses.map((x) => x.valueOf().toBech32());
  }
}
