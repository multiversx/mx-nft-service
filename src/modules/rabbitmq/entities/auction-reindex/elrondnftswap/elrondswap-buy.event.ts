import { GenericEvent } from '../../generic.event';
import { ElrondSwapBuyTopics } from './elrondswap-buy.event.topics';

export class ElrondSwapBuyEvent extends GenericEvent {
  private decodedTopics: ElrondSwapBuyTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ElrondSwapBuyTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
