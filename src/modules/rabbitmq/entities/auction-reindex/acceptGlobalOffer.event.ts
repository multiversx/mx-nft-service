import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { AcceptGlobalOfferEventsTopics } from './acceptGlobalOffer.event.topics';

export class AcceptGlobalOfferEvent extends EventLog {
  private decodedTopics: AcceptGlobalOfferEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new AcceptGlobalOfferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
