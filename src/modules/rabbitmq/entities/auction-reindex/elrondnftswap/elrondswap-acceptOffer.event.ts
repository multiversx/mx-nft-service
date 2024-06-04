import { GenericEvent } from '../../generic.event';
import { ElrondSwapAcceptOfferTopics } from './elrondswap-acceptOffer.event.topics';

export class ElrondSwapAcceptOfferEvent extends GenericEvent {
  private decodedTopics: ElrondSwapAcceptOfferTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ElrondSwapAcceptOfferTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
