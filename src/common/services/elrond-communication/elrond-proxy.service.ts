import {
  ProxyProvider,
  Address,
  SmartContract,
  AbiRegistry,
  SmartContractAbi,
} from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ElrondProxyService {
  private readonly proxy: ProxyProvider;
  constructor() {
    this.proxy = new ProxyProvider(elrondConfig.gateway, { timeout: 5000 });
  }

  getService(): ProxyProvider {
    return this.proxy;
  }

  async getSmartContract(): Promise<SmartContract> {
    let abiRegistry = await AbiRegistry.load({
      files: ['./src/abis/esdt-nft-marketplace.abi.json'],
    });
    let abi = new SmartContractAbi(abiRegistry, ['EsdtNftMarketplace']);

    let contract = new SmartContract({
      address: new Address(elrondConfig.nftMarketplaceAddress),
      abi: abi,
    });
    return contract;
  }

  async getRegisteredNfts(address: string): Promise<string[]> {
    return await this.getService().doGetGeneric(
      `address/${address}/registered-nfts`,
      (response) => response.tokens,
    );
  }
}
