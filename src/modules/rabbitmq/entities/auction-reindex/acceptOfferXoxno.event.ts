import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { GenericEvent } from '../generic.event';
import { AcceptOfferXoxnoEventsTopics } from './acceptOfferXoxno.event.topics';

export class AcceptOfferXoxnoEvent extends EventLog {
  private decodedTopics: AcceptOfferXoxnoEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new AcceptOfferXoxnoEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
