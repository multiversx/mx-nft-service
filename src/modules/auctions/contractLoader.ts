import {
  AbiRegistry,
  INetworkProvider,
  SmartContractController,
  SmartContractTransactionsFactory,
  TransactionsFactoryConfig,
} from '@multiversx/sdk-core';
import * as fs from 'fs';
import { mxConfig } from 'src/config';
import { MarketplaceUtils } from './marketplaceUtils';

export class ContractLoader {
  static async load(abiPath: string): Promise<AbiRegistry> {
    try {
      const jsonContent: string = await fs.promises.readFile(abiPath, { encoding: 'utf8' });
      const json = JSON.parse(jsonContent);

      const abiRegistry = AbiRegistry.create(json);

      return abiRegistry;
    } catch (error) {
      throw new Error('Error when creating contract from abi');
    }
  }

  static async getFactory(abiPath?: string): Promise<SmartContractTransactionsFactory> {
    return new SmartContractTransactionsFactory({
      config: new TransactionsFactoryConfig({ chainID: mxConfig.chainID }),
      abi: await ContractLoader.load(abiPath ?? MarketplaceUtils.commonMarketplaceAbiPath),
    });
  }

  static async getController(networkProvider: INetworkProvider, abiPath?: string): Promise<SmartContractController> {
    return new SmartContractController({
      chainID: mxConfig.chainID,
      networkProvider: networkProvider,
      abi: await ContractLoader.load(abiPath ?? MarketplaceUtils.commonMarketplaceAbiPath),
    });
  }
}
