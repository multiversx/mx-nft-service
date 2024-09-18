import { ScamInfoTypeEnum } from "src/modules/assets/models";

export class MarkScamCollectionEvent {
  collectionIdentifier: string;
  type: ScamInfoTypeEnum
  constructor(init?: Partial<MarkScamCollectionEvent>) {
    Object.assign(this, init);
  }
}
