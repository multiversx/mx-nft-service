import {
  Address,
  Balance,
  ContractFunction,
  IProvider,
  QueryResponse,
  SmartContract,
  TypedValue,
} from '@elrondnetwork/erdjs';
import { MetricsCollector } from './metrics.collector';
import { PerformanceProfiler } from './performance.profiler';

export class SmartContractProfiler extends SmartContract {
  runQuery(
    provider: IProvider,
    {
      func,
      args,
      value,
      caller,
    }: {
      func: ContractFunction;
      args?: TypedValue[];
      value?: Balance;
      caller?: Address;
    },
  ): Promise<QueryResponse> {
    const profiler = new PerformanceProfiler();

    const result = super.runQuery(provider, {
      func,
      args,
      value,
      caller,
    });

    profiler.stop();

    MetricsCollector.setExternalCall('vm.query', func.name, profiler.duration);

    return result;
  }
}
