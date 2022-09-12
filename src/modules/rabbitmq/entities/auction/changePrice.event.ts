import { GenericEvent } from '../generic.event';
import { ChangePriceEventsTopics } from './changePrice.event.topics';

export class ChangePriceEvent extends GenericEvent {
  private decodedTopics: ChangePriceEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ChangePriceEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
