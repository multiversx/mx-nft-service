import { SmartContractProfiler } from 'src/modules/metrics/smartcontract-profiler';
import { Address, SmartContract } from '../../../../../elrond-sdk-erdjs';

export function getSmartContract(address: string): SmartContract {
  return new SmartContractProfiler({
    address: new Address(address),
  });
}
