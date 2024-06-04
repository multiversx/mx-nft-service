import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { ElrondSwapAuctionTopics } from './elrondswap-auction.event.topics';

export class ElrondSwapAuctionEvent extends EventLog {
  private decodedTopics: ElrondSwapAuctionTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new ElrondSwapAuctionTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
