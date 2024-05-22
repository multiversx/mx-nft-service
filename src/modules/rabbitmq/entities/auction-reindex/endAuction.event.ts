import { GenericEvent } from '../generic.event';
import { EndAuctionEventsTopics } from './endAuction.event.topics';

export class EndAuctionEvent extends GenericEvent {
  private decodedTopics: EndAuctionEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new EndAuctionEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
