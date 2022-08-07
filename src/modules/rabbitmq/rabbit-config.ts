export interface RabbitConsumerConfig {
  connection?: string | undefined;
  exchange: string;
  queueName: string;
  dlqExchange?: string;
}

export interface RabbitModuleConfig {
  uri: string;
  exchange: string;
}

export const rabbitExchanges = {
  CACHE_INVALIDATION: 'nft-cache-invalidation',
};

export const rabbitQueues = {
  CACHE_INVALIDATION: 'nft-cache-invalidation',
};
