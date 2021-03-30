import { ProxyProvider, ContractFunction, Address } from '@elrondnetwork/erdjs';
import { elrondConfig } from '../../../config';
import { Inject, Injectable } from '@nestjs/common';
import { Query } from '@elrondnetwork/erdjs/out/smartcontracts/query';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { CacheManagerService } from '../cache-manager/cache-manager.service';
import { QueryResponse } from '@elrondnetwork/erdjs/out/smartcontracts';
import { QueryResponseHelper } from 'src/helpers';

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

  async getAllContractAddresses() {
    const cachedData = await this.cacheManager.getAllContractAddresses();
    if (!!cachedData) {
      return QueryResponse.fromHttpResponse(cachedData);
    }

    const query = new Query({
      address: new Address(elrondConfig.stakingContract),
      func: new ContractFunction('getAllContractAddresses'),
    });
    const result = await this.proxy.queryContract(query);
    this.logger.info('getContractList', {
      path: 'elrond-proxy.service.getContractList',
      returnCode: result.returnCode,
      returnMessage: result.returnMessage,
    });

    await this.cacheManager.setAllContractAddresses(
      QueryResponseHelper.getDataForCache(result),
    );
    return result;
  }
}
