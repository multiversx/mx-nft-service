import { ProxyNetworkProvider } from '@elrondnetwork/erdjs-network-providers';
import { elrondConfig } from '../../../config';
import * as Agent from 'agentkeepalive';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ElrondProxyService {
  private readonly proxy: ProxyNetworkProvider;
  constructor() {
    const keepAliveOptions = {
      maxSockets: elrondConfig.keepAliveMaxSockets,
      maxFreeSockets: elrondConfig.keepAliveMaxFreeSockets,
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
      freeSocketTimeout: elrondConfig.keepAliveFreeSocketTimeout,
    };
    const httpAgent = new Agent(keepAliveOptions);
    const httpsAgent = new Agent.HttpsAgent(keepAliveOptions);

    this.proxy = new ProxyNetworkProvider(process.env.ELROND_GATEWAY, {
      timeout: parseInt(process.env.KEEPALIVE_TIMEOUT_DOWNSTREAM),
      httpAgent: elrondConfig.keepAlive ? httpAgent : null,
      httpsAgent: elrondConfig.keepAlive ? httpsAgent : null,
    });
  }

  getService(): ProxyNetworkProvider {
    return this.proxy;
  }
}
