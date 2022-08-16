import {
  Address,
  SmartContract,
  AbiRegistry,
  SmartContractAbi,
} from '@elrondnetwork/erdjs';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import { SmartContractProfiler } from 'src/modules/metrics/smartcontract-profiler';

@Injectable()
export class AbiLoadService {
  async getSmartContract(
    address: string,
    filePath: string,
    abiInterface: string,
  ): Promise<SmartContract> {
    let jsonContent: string = await fs.promises.readFile(filePath, {
      encoding: 'utf8',
    });
    let json = JSON.parse(jsonContent);
    let abiRegistry = AbiRegistry.create(json);
    let abi = new SmartContractAbi(abiRegistry, [abiInterface]);

    let contract = new SmartContractProfiler({
      address: new Address(address),
      abi: abi,
    });
    return contract;
  }
}
