import {
  ProxyProvider,
  Address,
  SmartContract,
  AbiRegistry,
  SmartContractAbi,
} from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CacheManagerService } from '../cache-manager/cache-manager.service';

@Injectable()
export class ElrondProxyService {
  private readonly proxy: ProxyProvider;
  constructor(
    private cacheManager: CacheManagerService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.proxy = new ProxyProvider(elrondConfig.gateway, 60000);
  }

  getService(): ProxyProvider {
    return this.proxy;
  }

  async getSmartCntract(): Promise<SmartContract> {
    console.log('here');
    let abiRegistry = await AbiRegistry.load({
      files: ['./src/abis/esdt-nft-marketplace.abi.json'],
    });
    let abi = new SmartContractAbi(abiRegistry, ['EsdtNftMarketplace']);

    let contract = new SmartContract({
      address: new Address(
        'erd1qqqqqqqqqqqqqpgqw8faqylfxhsx3nvpngkh9sf97gh877ysd8ssererdq',
      ),
      abi: abi,
    });
    return contract;
  }
}
