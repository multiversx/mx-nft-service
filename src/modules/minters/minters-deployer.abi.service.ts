import { Injectable } from '@nestjs/common';
import { Address, AddressValue, BytesValue, U32Value } from '@multiversx/sdk-core/out';
import { ContractLoader } from '@multiversx/sdk-nestjs';
import { MarketplaceUtils } from '../auctions/marketplaceUtils';
import { TransactionNode } from '../common/transaction';
import { DeployMinterRequest, UpgradeMinterRequest } from './models/requests/DeployMinterRequest';
import { mxConfig, gas } from 'src/config';

@Injectable()
export class MintersDeployerAbiService {
  private contract = new ContractLoader(MarketplaceUtils.deployerMintersAbiPath, MarketplaceUtils.deployerAbiInterface);

  async deployMinter(request: DeployMinterRequest): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);

    return contract.methodsExplicit
      .createNftMinter([
        BytesValue.fromUTF8(request.collectionCategory),
        new AddressValue(new Address(request.royaltiesClaimAddress)),
        new AddressValue(new Address(request.mintClaimAddress)),
        new U32Value(request.maxNftsPerTransaction),
      ])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.deployMinter)
      .buildTransaction()
      .toPlainObject(new Address(request.ownerAddress));
  }

  async pauseNftMinter(ownerAddress: string, request: UpgradeMinterRequest): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);

    return contract.methodsExplicit
      .pauseNftMinter([new AddressValue(new Address(request.minterAddress))])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.deployMinter)
      .buildTransaction()
      .toPlainObject(new Address(ownerAddress));
  }

  async resumeNftMinter(ownerAddress: string, request: UpgradeMinterRequest): Promise<TransactionNode> {
    const contract = await this.contract.getContract(process.env.DEPLOYER_ADDRESS);

    return contract.methodsExplicit
      .resumeNftMinter([new AddressValue(new Address(request.minterAddress))])
      .withChainID(mxConfig.chainID)
      .withGasLimit(gas.deployMinter)
      .buildTransaction()
      .toPlainObject(new Address(ownerAddress));
  }
}
