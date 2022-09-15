import { GenericEvent } from '../../generic.event';
import { ElrondSwapBidEventsTopics } from './elrondswap-bid.event.topics';

export class ElrondSwapBidEvent extends GenericEvent {
  private decodedTopics: ElrondSwapBidEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ElrondSwapBidEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
