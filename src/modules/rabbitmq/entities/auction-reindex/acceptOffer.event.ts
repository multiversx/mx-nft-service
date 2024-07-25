import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { AcceptOfferEventsTopics } from './acceptOffer.event.topics';

export class AcceptOfferEvent extends EventLog {
  private decodedTopics: AcceptOfferEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new AcceptOfferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
