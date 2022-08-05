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
