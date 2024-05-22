import { GenericEvent } from '../../generic.event';
import { ElrondSwapWithdrawTopics } from './elrondswap-withdraw.event.topics';

export class ElrondSwapWithdrawEvent extends GenericEvent {
  private decodedTopics: ElrondSwapWithdrawTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ElrondSwapWithdrawTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
