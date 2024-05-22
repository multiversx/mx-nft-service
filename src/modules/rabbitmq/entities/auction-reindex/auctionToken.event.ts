import { GenericEvent } from '../generic.event';
import { AuctionTokenEventsTopics } from './auctionToken.event.topics';

export class AuctionTokenEvent extends GenericEvent {
  private decodedTopics: AuctionTokenEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new AuctionTokenEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
