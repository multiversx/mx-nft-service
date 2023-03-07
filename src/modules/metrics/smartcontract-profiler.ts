import {
  Address,
  ContractFunction,
  ITransactionValue,
  Query,
  SmartContract,
  TypedValue,
} from '@multiversx/sdk-core';
import { MetricsCollector } from './metrics.collector';
import { PerformanceProfiler } from './performance.profiler';

export class SmartContractProfiler extends SmartContract {
  createQuery({
    func,
    args,
    value,
    caller,
  }: {
    func: ContractFunction;
    args?: TypedValue[];
    value?: ITransactionValue;
    caller?: Address;
  }): Query {
    const profiler = new PerformanceProfiler();

    const result = super.createQuery({
      func,
      args,
      value,
      caller,
    });

    profiler.stop();

    MetricsCollector.setExternalCall('vm.query', profiler.duration, func.name);

    return result;
  }
}
