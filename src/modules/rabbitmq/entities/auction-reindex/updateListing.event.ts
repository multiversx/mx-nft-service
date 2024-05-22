import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { UpdateListingEventsTopics } from './updateListing.event.topics';

export class UpdateListingEvent extends EventLog {
  private decodedTopics: UpdateListingEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new UpdateListingEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
