import { EventResponse } from 'src/common/services/mx-communication/models/elastic-search/event.response';
import BigNumber from 'bignumber.js';

export class GenericEvent {
  private address = '';
  private identifier = '';
  protected topics = [];
  protected data = '';
  protected timestamp: BigNumber | undefined;

  constructor(init?: Partial<GenericEvent>) {
    Object.assign(this, init);
  }

  getAddress(): string {
    return this.address;
  }

  getIdentifier(): string {
    return this.identifier;
  }

  getTimestamp(): BigNumber | undefined {
    return this.timestamp;
  }

  toJSON(): any {
    return {
      address: this.address,
      identifier: this.identifier,
      data: this.data,
      topics: this.topics,
      timestamp: this.timestamp?.toNumber(),
    };
  }

  static fromEventResponse(eventResponse: EventResponse): GenericEvent {
    let event = new GenericEvent();
    event.address = eventResponse.address;
    event.identifier = eventResponse.identifier;
    event.topics = eventResponse.topics;
    event.data = eventResponse.data;
    return event;
  }
}
