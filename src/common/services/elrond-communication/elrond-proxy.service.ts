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
import { Injectable } from '@nestjs/common';

@Injectable()
export class ElrondProxyService {
  private readonly proxy: ProxyProvider;
  constructor() {
    this.proxy = new ProxyProvider(elrondConfig.gateway, 60000);
  }

  getService(): ProxyProvider {
    return this.proxy;
  }

  async getSmartCntract(): Promise<SmartContract> {
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

  async getTokenProperties(token_identifier: string): Promise<any> {
    const contract = new SmartContract({
      address: new Address(elrondConfig.esdtNftAddress),
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
