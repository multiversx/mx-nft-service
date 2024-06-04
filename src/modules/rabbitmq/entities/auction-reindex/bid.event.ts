import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { BidEventsTopics } from './bid.event.topics';

export class BidEvent extends EventLog {
  private decodedTopics: BidEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new BidEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
