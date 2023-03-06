export class UserNftLikeEvent {
  address: string;
  nftIdentifier: string;
  constructor(init?: Partial<UserNftLikeEvent>) {
    Object.assign(this, init);
  }
}
