import {
  Address,
  SmartContract,
  AbiRegistry,
  SmartContractAbi,
} from '@elrondnetwork/erdjs';
import { ProxyNetworkProvider } from '@elrondnetwork/erdjs-network-providers';
import * as fs from 'fs';
import { elrondConfig } from '../../../config';
import * as Agent from 'agentkeepalive';
import { Injectable } from '@nestjs/common';
import { SmartContractProfiler } from 'src/modules/metrics/smartcontract-profiler';

@Injectable()
export class ElrondProxyService {
  private readonly proxy: ProxyNetworkProvider;
  constructor() {
    const keepAliveOptions = {
      maxSockets: elrondConfig.keepAliveMaxSockets,
      maxFreeSockets: elrondConfig.keepAliveMaxFreeSockets,
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
      freeSocketTimeout: elrondConfig.keepAliveFreeSocketTimeout,
    };
    const httpAgent = new Agent(keepAliveOptions);
    const httpsAgent = new Agent.HttpsAgent(keepAliveOptions);

    this.proxy = new ProxyNetworkProvider(process.env.ELROND_GATEWAY, {
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
      httpAgent: elrondConfig.keepAlive ? httpAgent : null,
      httpsAgent: elrondConfig.keepAlive ? httpsAgent : null,
    });
  }

  getService(): ProxyNetworkProvider {
    return this.proxy;
  }

  async getMarketplaceAbiSmartContract(): Promise<SmartContract> {
    let jsonContent: string = await fs.promises.readFile(
      './src/abis/esdt-nft-marketplace.abi.json',
      {
        encoding: 'utf8',
      },
    );
    let json = JSON.parse(jsonContent);
    let abiRegistry = await AbiRegistry.create(json);
    let abi = new SmartContractAbi(abiRegistry, ['EsdtNftMarketplace']);

    let contract = new SmartContractProfiler({
      address: new Address(elrondConfig.nftMarketplaceAddress),
      abi: abi,
    });
    return contract;
  }

  async getMinterAbiSmartContract(address: string): Promise<SmartContract> {
    let jsonContent: string = await fs.promises.readFile(
      './src/abis/nft-minter.abi.json',
      {
        encoding: 'utf8',
      },
    );
    let json = JSON.parse(jsonContent);
    let abiRegistry = await AbiRegistry.create(json);
    let abi = new SmartContractAbi(abiRegistry, ['NftMinter']);

    let contract = new SmartContractProfiler({
      address: new Address(address),
      abi: abi,
    });
    return contract;
  }
}
