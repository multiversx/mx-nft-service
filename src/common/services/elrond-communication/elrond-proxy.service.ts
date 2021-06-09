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
import { Token } from './models/interfaces/elrond/token.dto';

@Injectable()
export class ElrondProxyService {
  private readonly proxy: ProxyProvider;
  constructor() {
    this.proxy = new ProxyProvider(elrondConfig.gateway, 100000);
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

  async getNftByToken(
    address: string,
    token: string,
    nonce: number,
  ): Promise<Token> {
    return await this.getService().doGetGeneric(
      `address/${address}/nft/${token}/nonce/${nonce}`,
      (response) => response.tokenData,
    );
  }

  async getRegisteredNfts(address: string): Promise<string[]> {
    return await this.getService().doGetGeneric(
      `address/${address}/registered-nfts`,
      (response) => response.tokens,
    );
  }
}
