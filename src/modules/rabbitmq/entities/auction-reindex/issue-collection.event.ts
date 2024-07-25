import { GenericEvent } from '../generic.event';
import { TransferEventsTopics } from './transfer.event.topics';

export class IssueCollectionEvent extends GenericEvent {
  private decodedTopics: TransferEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new TransferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
