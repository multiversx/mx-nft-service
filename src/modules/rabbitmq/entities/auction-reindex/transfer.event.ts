import { GenericEvent } from '../generic.event';
import { MultiTransferEventsTopics as MultiTransferEventTopics, TransferEventsTopics } from './transfer.event.topics';

export class TransferEvent extends GenericEvent {
  private decodedTopics: TransferEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new TransferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}

export class MultiTransferEvent extends GenericEvent {
  private decodedTopics: MultiTransferEventTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new MultiTransferEventTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
