import { GenericEvent } from '../generic.event';
import { AcceptOfferDeadrareEventsTopics } from './acceptOfferDeadrare.event.topics';

export class AcceptOfferDeadrareEvent extends GenericEvent {
  private decodedTopics: AcceptOfferDeadrareEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new AcceptOfferDeadrareEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
