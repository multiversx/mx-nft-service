export class MxStats {
  shards: number;
  blocks: number;
  accounts: number;
  transactions: number;
  refreshRate: number;
  epoch: number;
  roundsPassed: number;
  roundsPerEpoch: number;

  constructor(init?: Partial<MxStats>) {
    Object.assign(this, init);
  }
}
