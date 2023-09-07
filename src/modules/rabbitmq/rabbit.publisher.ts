import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RabbitPublisherService {
  constructor(private readonly amqpConnection: AmqpConnection, private readonly logger: Logger) {}

  /** Will publish the input to the exchange. */
  async publish(exchange: string, input: unknown): Promise<void> {
    try {
      await this.amqpConnection.publish(exchange, '', input);
    } catch (err) {
      this.logger.error('An error occurred while publishing to RabbitMq Exchange.', {
        exchange,
        input,
        exception: err?.toString(),
        errStack: err?.stack,
        errStackAtStateChange: err?.stackAtStateChange,
      });
    }
  }
}
