import {
  Address,
  AddressValue,
  BytesValue,
  SmartContractController,
  SmartContractQuery,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig,
  U32Value,
  VariadicValue,
} from '@multiversx/sdk-core';
import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { gas, mxConfig } from 'src/config';
import { ContractLoader } from '../auctions/contractLoader';
import { MarketplaceUtils } from '../auctions/marketplaceUtils';
import { TransactionNode } from '../common/transaction';
import { DeployMinterRequest, UpgradeMinterRequest } from './models/requests/DeployMinterRequest';

@Injectable()
export class ProxyDeployerAbiService {
  constructor(private mxApiService: MxApiService) {}
  async getFactory(abiPath?: string): Promise<SmartContractTransactionsFactory> {
    return new SmartContractTransactionsFactory({
      config: new TransactionsFactoryConfig({ chainID: mxConfig.chainID }),
      abi: await ContractLoader.load(abiPath ?? MarketplaceUtils.commonMarketplaceAbiPath),
    });
  }

  async getController(abiPath?: string): Promise<SmartContractController> {
    return new SmartContractController({
      chainID: mxConfig.chainID,
      networkProvider: this.mxApiService.getService(),
      abi: await ContractLoader.load(abiPath ?? MarketplaceUtils.commonMarketplaceAbiPath),
    });
  }
  async deployMinterSc(request: DeployMinterRequest): Promise<TransactionNode> {
    const factory = await this.getFactory(MarketplaceUtils.proxyDeployerMintersAbiPath);

    const transaction = await factory.createTransactionForExecute(Address.newFromBech32(request.ownerAddress), {
      contract: Address.newFromBech32(process.env.PROXY_DEPLOYER_ADDRESS),
      function: 'contractDeploy',
      gasLimit: gas.deployMinter,
      arguments: [
        new AddressValue(Address.newFromBech32(process.env.TEMPLATE_MINTER_ADDRESS)),
        VariadicValue.fromItems(
          BytesValue.fromHex(Address.newFromBech32(request.royaltiesClaimAddress).hex()),
          BytesValue.fromHex(Address.newFromBech32(request.mintClaimAddress).hex()),
          new U32Value(request.maxNftsPerTransaction),
          BytesValue.fromHex(Address.newFromBech32(request.ownerAddress).hex()),
        ),
      ],
    });

    return transaction.toPlainObject();
  }

  async deployBulkSc(ownerAddress: string): Promise<TransactionNode> {
    const factory = await this.getFactory(MarketplaceUtils.proxyDeployerMintersAbiPath);

    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(process.env.PROXY_DEPLOYER_ADDRESS),
      function: 'contractDeploy',
      gasLimit: gas.deployMinter,
      arguments: [
        new AddressValue(Address.newFromBech32(process.env.TEMPLATE_BULK_ADDRESS)),
        VariadicValue.fromItems(BytesValue.fromHex(Address.newFromBech32(ownerAddress).hex())),
      ],
    });

    return transaction.toPlainObject();
  }

  async deployMarketplaceSc(ownerAddress: string, marketplaceFee: string, paymentTokens?: string[]): Promise<TransactionNode> {
    const factory = await this.getFactory(MarketplaceUtils.proxyDeployerMintersAbiPath);
    const args: any[] = [new AddressValue(Address.newFromBech32(process.env.TEMPLATE_MARKETPLACE_ADDRESS))];
    if (paymentTokens) {
      args.push(
        VariadicValue.fromItems(
          new U32Value(marketplaceFee),
          VariadicValue.fromItems(...paymentTokens?.map((paymentToken) => BytesValue.fromUTF8(paymentToken))),
        ),
      );
    }

    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(process.env.PROXY_DEPLOYER_ADDRESS),
      function: 'contractDeploy',
      gasLimit: gas.deployMinter,
      arguments: args,
    });

    return transaction.toPlainObject();
  }

  async pauseNftMinter(ownerAddress: string, request: UpgradeMinterRequest): Promise<TransactionNode> {
    const factory = await this.getFactory(MarketplaceUtils.proxyDeployerMintersAbiPath);

    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(process.env.PROXY_DEPLOYER_ADDRESS),
      function: 'pauseNftMinter',
      gasLimit: gas.deployMinter,
      arguments: [new AddressValue(Address.newFromBech32(request.minterAddress))],
    });

    return transaction.toPlainObject();
  }

  async resumeNftMinter(ownerAddress: string, request: UpgradeMinterRequest): Promise<TransactionNode> {
    const factory = await this.getFactory(MarketplaceUtils.proxyDeployerMintersAbiPath);

    const transaction = factory.createTransactionForExecute(Address.newFromBech32(ownerAddress), {
      contract: Address.newFromBech32(process.env.PROXY_DEPLOYER_ADDRESS),
      function: 'resumeNftMinter',
      gasLimit: gas.deployMinter,
      arguments: [new AddressValue(Address.newFromBech32(request.minterAddress))],
    });

    return transaction.toPlainObject();
  }

  public async getDeployedContractsForAddressAndTemplate(address: string, templateAddress: string): Promise<string[]> {
    const controller: SmartContractController = await this.getController();

    const getDataQuery = await controller.runQuery(
      new SmartContractQuery({
        contract: Address.newFromBech32(process.env.PROXY_DEPLOYER_ADDRESS),
        function: 'getDeployerContractsByTemplate',
        arguments: [
          new Uint8Array(Buffer.from(new AddressValue(Address.newFromBech32(address)).toString())),
          new Uint8Array(Buffer.from(new AddressValue(Address.newFromBech32(templateAddress)).toString())),
        ],
      }),
    );

    const [response] = controller.parseQueryResponse(getDataQuery);

    const contractAddresses: AddressValue[] = response.valueOf().toFixed();

    return contractAddresses.map((x) => x.valueOf().toBech32());
  }
}
