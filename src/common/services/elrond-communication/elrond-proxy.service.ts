import {
  ProxyProvider,
  Address,
  SmartContract,
  AbiRegistry,
  SmartContractAbi,
} from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import * as Agent from 'agentkeepalive';
import { Injectable } from '@nestjs/common';
import { SmartContractProfiler } from 'src/modules/metrics/smartcontract-profiler';

@Injectable()
export class ElrondProxyService {
  private readonly proxy: ProxyProvider;
  constructor() {
    const keepAliveOptions = {
      maxSockets: elrondConfig.keepAliveMaxSockets,
      maxFreeSockets: elrondConfig.keepAliveMaxFreeSockets,
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
      freeSocketTimeout: elrondConfig.keepAliveFreeSocketTimeout,
    };
    const httpAgent = new Agent(keepAliveOptions);
    const httpsAgent = new Agent.HttpsAgent(keepAliveOptions);

    this.proxy = new ProxyProvider(process.env.ELROND_GATEWAY, {
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
      httpAgent: elrondConfig.keepAlive ? httpAgent : null,
      httpsAgent: elrondConfig.keepAlive ? httpsAgent : null,
    });
  }

  getService(): ProxyProvider {
    return this.proxy;
  }

  async getMarketplaceAbiSmartContract(): Promise<SmartContract> {
    let abiRegistry = await AbiRegistry.load({
      files: ['./src/abis/esdt-nft-marketplace.abi.json'],
    });
    let abi = new SmartContractAbi(abiRegistry, ['EsdtNftMarketplace']);

    let contract = new SmartContractProfiler({
      address: new Address(elrondConfig.nftMarketplaceAddress),
      abi: abi,
    });
    return contract;
  }

  async getMinterAbiSmartContract(address: string): Promise<SmartContract> {
    let abiRegistry = await AbiRegistry.load({
      files: ['./src/abis/nft-minter.abi.json'],
    });
    let abi = new SmartContractAbi(abiRegistry, ['NftMinter']);

    let contract = new SmartContractProfiler({
      address: new Address(address),
      abi: abi,
    });
    return contract;
  }

  async getCollections(address: string): Promise<string[]> {
    return await this.getService().doGetGeneric(
      `address/${address}/registered-nfts`,
      (response) => response.tokens,
    );
  }
}
