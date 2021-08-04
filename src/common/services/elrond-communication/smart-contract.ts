import { Address, SmartContract } from '@elrondnetwork/erdjs';
import { SmartContractProfiler } from 'src/modules/metrics/smartcontract-profiler';

export function getSmartContract(address: string): SmartContract {
  return new SmartContractProfiler({
    address: new Address(address),
  });
}
