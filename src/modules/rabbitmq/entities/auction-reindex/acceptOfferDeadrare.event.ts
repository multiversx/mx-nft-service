import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { AcceptOfferDeadrareEventsTopics } from './acceptOfferDeadrare.event.topics';

export class AcceptOfferDeadrareEvent extends EventLog {
  private decodedTopics: AcceptOfferDeadrareEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new AcceptOfferDeadrareEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
