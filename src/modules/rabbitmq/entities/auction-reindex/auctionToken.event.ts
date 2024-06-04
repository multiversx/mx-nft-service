import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { AuctionTokenEventsTopics } from './auctionToken.event.topics';

export class AuctionTokenEvent extends EventLog {
  private decodedTopics: AuctionTokenEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new AuctionTokenEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
