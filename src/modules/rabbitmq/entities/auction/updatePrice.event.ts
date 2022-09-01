import { GenericEvent } from '../generic.event';
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
