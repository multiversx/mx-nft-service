export class RabbitEvent {
  hash!: string;
  shardId!: number;
  timestamp!: number;
  events: RabbitEventLog[] = [];
  constructor(init: Partial<RabbitEvent>) {
    Object.assign(this, init);
  }
}

export class RabbitEventLog {
  address!: string;
  identifier!: string;
  topics: string[] = [];
  data: string = '';
  txHash!: string;
  additionalData: string[] = [];
  constructor(init?: Partial<RabbitEventLog>) {
    Object.assign(this, init);
  }
}
