export class ElrondStats {
  shards: number;
  blocks: number;
  accounts: number;
  transactions: number;
  refreshRate: number;
  epoch: number;
  roundsPassed: number;
  roundsPerEpoch: number;

  constructor(init?: Partial<ElrondStats>) {
    Object.assign(this, init);
  }
}
