import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { EndAuctionEventsTopics } from './endAuction.event.topics';

export class EndAuctionEvent extends EventLog {
  private decodedTopics: EndAuctionEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new EndAuctionEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
