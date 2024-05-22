import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { GenericEvent } from '../../generic.event';
import { ElrondSwapBuyTopics } from './elrondswap-buy.event.topics';

export class ElrondSwapBuyEvent extends EventLog {
  private decodedTopics: ElrondSwapBuyTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new ElrondSwapBuyTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
