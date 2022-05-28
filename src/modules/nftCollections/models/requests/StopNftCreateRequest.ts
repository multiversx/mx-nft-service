import { StopNftCreateArgs } from '../StopNftCreateArgs';

export class StopNftCreateRequest {
  collection: string;
  ownerAddress: string;
  constructor(init?: Partial<StopNftCreateRequest>) {
    Object.assign(this, init);
  }

  static fromArgs(stopNftCreateRequest: StopNftCreateArgs) {
    return new StopNftCreateRequest({
      collection: stopNftCreateRequest.collection,
      ownerAddress: stopNftCreateRequest.ownerAddress,
    });
  }
}
