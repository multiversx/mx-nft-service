import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { AcceptOfferFrameitEventsTopics } from './acceptOfferFrameit.event.topics';

export class AcceptOfferFrameitEvent extends EventLog {
  private decodedTopics: AcceptOfferFrameitEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new AcceptOfferFrameitEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
