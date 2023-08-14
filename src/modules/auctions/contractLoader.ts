import { AbiRegistry, SmartContract, Address } from '@multiversx/sdk-core';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';

export class ContractLoader {
  private readonly abiPath: string;
  private abi: AbiRegistry | undefined = undefined;
  private readonly logger: Logger;

  constructor(abiPath: string) {
    this.abiPath = abiPath;
    this.logger = new Logger(ContractLoader.name);
  }

  async getContract(contractAddress: string): Promise<SmartContract> {
    if (!this.abi) {
      this.abi = await this.load();
    }

    return new SmartContract({
      address: new Address(contractAddress),
      abi: this.abi,
    });
  }

  private async load(): Promise<AbiRegistry> {
    try {
      const jsonContent: string = await fs.promises.readFile(this.abiPath, { encoding: 'utf8' });
      const json = JSON.parse(jsonContent);

      const abiRegistry = AbiRegistry.create(json);

      return abiRegistry;
    } catch (error) {
      this.logger.error(`Unexpected error when trying to create smart contract from abi`);
      this.logger.error(error);

      throw new Error('Error when creating contract from abi');
    }
  }
}
