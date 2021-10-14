export class GenericEvent {
  private address = '';
  private identifier = '';
  protected topics = [];
  protected data = '';

  constructor(init?: Partial<GenericEvent>) {
    Object.assign(this, init);
  }

  getAddress(): string {
    return this.address;
  }

  getIdentifier(): string {
    return this.identifier;
  }

  toJSON(): any {
    return {
      address: this.address,
      identifier: this.identifier,
      data: this.data,
      topics: this.topics,
    };
  }
}
