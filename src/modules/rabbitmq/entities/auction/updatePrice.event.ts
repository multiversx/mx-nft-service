import { GenericEvent } from '../generic.event';
import { ChangePriceEventsTopics } from './changePrice.event.topics';
import { UpdatePriceEventsTopics } from './updatePrice.event.topics';

export class UpdatePriceEvent extends GenericEvent {
  private decodedTopics: UpdatePriceEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new UpdatePriceEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
