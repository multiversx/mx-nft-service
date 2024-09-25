import { ScamInputEnum } from "src/modules/admins/models/scam-update.input";

export class MarkScamCollectionEvent {
  collectionIdentifier: string;
  type: ScamInputEnum
  constructor(init?: Partial<MarkScamCollectionEvent>) {
    Object.assign(this, init);
  }
}
