export interface RabbitConsumerConfig {
  connection?: string | undefined;
  exchange: string;
  queueName: string;
  disable?: boolean;
  dlqExchange?: string;
}

export interface RabbitModuleConfig {
  uri: string;
  exchange: string;
}

export const rabbitExchanges = {
  CACHE_INVALIDATION: 'nft-cache-invalidation',
  NFT_LIKE: 'x_portal_gamification_nft_likes_exchange',
  SCAM_UPDATE: 'nft-scam-update',
};

export const rabbitQueues = {
  CACHE_INVALIDATION: 'nft-cache-invalidation',
  SCAM_UPDATE: 'nft-scam-update',
};
