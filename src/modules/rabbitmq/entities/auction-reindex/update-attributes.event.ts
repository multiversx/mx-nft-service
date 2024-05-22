import { GenericEvent } from '../generic.event';
import { UpdateAttributesEventsTopics } from './update-attributes.event.topics';

export class UpdateAttributesEvent extends GenericEvent {
  private decodedTopics: UpdateAttributesEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new UpdateAttributesEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
