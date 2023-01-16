import { GenericEvent } from '../generic.event';
import { UpdateListingEventsTopics } from './updateListing.event.topics';

export class UpdateListingEvent extends GenericEvent {
  private decodedTopics: UpdateListingEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new UpdateListingEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
