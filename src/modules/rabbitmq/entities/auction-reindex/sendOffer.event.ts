import { GenericEvent } from '../generic.event';
import { SendOfferEventsTopics } from './sendOffer.event.topics';

export class SendOfferEvent extends GenericEvent {
  private decodedTopics: SendOfferEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new SendOfferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
