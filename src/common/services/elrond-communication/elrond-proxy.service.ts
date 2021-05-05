import {
  ProxyProvider,
  Address,
  SmartContract,
  AbiRegistry,
  SmartContractAbi,
  ContractFunction,
  BytesValue,
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

  async getTokens(tickers: string[]): Promise<any> {
    let tokens = await this.getService().doGetGeneric(
      'network/esdts',
      (response) => {
        return this.fromHttpResponse(response.tokens);
      },
    );
    let tokenss: any[] = [];
    tickers.forEach((element) => {
      let t = tokens.filter((value) => value.includes(element));
      let d = [];
      t.forEach((elem) => {
        const tok = { tokenIdentifier: elem, tokenTicker: element };
        d.push(tok);
      });
      if (d !== undefined) tokenss = [...d];
    });
    return tokenss;
  }

  async getTokenProperties(token_identifier: string): Promise<any> {
    const contract = new SmartContract({
      address: new Address(
        'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u',
      ),
    });
    let response = await contract.runQuery(this.getService(), {
      func: new ContractFunction('getTokenProperties'),
      args: [BytesValue.fromUTF8(token_identifier)],
    });
    return response.returnData[2].base64ToBech32();
  }

  fromHttpResponse(payload: any): any {
    return payload;
  }
}
