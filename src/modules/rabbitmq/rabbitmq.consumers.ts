import { defaultNackErrorHandler, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';
import { RabbitConsumerConfig } from './rabbit-config';

/** Competing Consumer which will be handled by only one instance of the microservice.
 * Make sure the exchange exists.
 */
export const CompetingRabbitConsumer = (config: RabbitConsumerConfig) => {
  if (config.disable) {
    return applyDecorators();
  }
  return applyDecorators(
    RabbitSubscribe({
      connection: config.connection ?? 'default',
      queue: config.queueName,
      exchange: config.exchange,
      routingKey: '',
      errorHandler: defaultNackErrorHandler,
      queueOptions: {
        autoDelete: false,
        durable: true,
        arguments: {
          'x-queue-type': 'classic',
          'x-queue-mode': 'lazy',
          'x-single-active-consumer': true,
        },
        deadLetterExchange: config.dlqExchange,
      },
    }),
  );
};

/** Public Consumer which will be handled by all instances of the microservice.
 * Make sure the exchange exists.
 */
export const PublicRabbitConsumer = (config: RabbitConsumerConfig) => {
  const { queueName, exchange, connection } = config;
  if (config.disable) {
    return applyDecorators();
  }
  return applyDecorators(
    RabbitSubscribe({
      connection: connection ?? 'default',
      queue: queueName,
      exchange,
      routingKey: '',
      queueOptions: {
        autoDelete: false,
      },
    }),
  );
};
