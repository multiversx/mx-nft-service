import { GenericEvent } from '../../generic.event';
import { ElrondSwapUpdateTopics } from './elrondswap-updateAuction.event.topics';

export class ElrondSwapUpdateEvent extends GenericEvent {
  private decodedTopics: ElrondSwapUpdateTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ElrondSwapUpdateTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
