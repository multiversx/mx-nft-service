import { GenericEvent } from '../generic.event';
import { WithdrawOfferEventsTopics } from './withdrawOffer.event.topics';

export class WithdrawOfferEvent extends GenericEvent {
  private decodedTopics: WithdrawOfferEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new WithdrawOfferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
