import { GenericEvent } from '../generic.event';
import { WithdrawEventsTopics } from './withdraw.event.topics';

export class WithdrawEvent extends GenericEvent {
  private decodedTopics: WithdrawEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new WithdrawEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
