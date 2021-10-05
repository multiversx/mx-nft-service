import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { applyDecorators } from '@nestjs/common';
import * as uuid from 'uuid';

/** Competing Consumer which will be handled by only one instance of the microservice.
 * Make sure the exchange exists.
 */
export const CompetingRabbitConsumer = () => {
  return applyDecorators(
    RabbitSubscribe({
      queue: `${process.env.RABBITMQ_QUEUE}`,
      exchange: process.env.RABBITMQ_EXCHANGE,
      routingKey: '',
    }),
  );
};

/** Public Consumer which will be handled by all instances of the microservice.
 * Make sure the exchange exists.
 */
export const PublicRabbitConsumer = () => {
  return applyDecorators(
    RabbitSubscribe({
      queue: `${process.env.RABBITMQ_QUEUE}_${uuid.v4()}`,
      exchange: process.env.RABBITMQ_EXCHANGE,
      routingKey: '',
      queueOptions: {
        autoDelete: true,
      },
    }),
  );
};
