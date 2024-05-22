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

export class EventLog {
  eventId: string = '';
  txHash: string = '';
  shardId: number = 0;
  timestamp: number = 0;
  address: string = '';
  identifier: string = '';
  topics: string[] = [];
  data: string = '';
  additionalData: string[] = [];
  txOrder: number = 0;
  eventOrder: number = 0;
  constructor(init?: Partial<EventLog>) {
    Object.assign(this, init);
  }
}
