import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { WhitelistMinterRequest } from 'src/modules/minters/models/requests/whitelistMinterRequest';

@Entity('minters')
export class MinterEntity extends BaseEntity {
  @Column({ length: 62 })
  address: string;

  @Column({ length: 62 })
  adminAddress: string;

  static fromRequest(args: WhitelistMinterRequest) {
    return new MinterEntity({
      address: args.address,
      adminAddress: args.adminAddress,
    });
  }

  constructor(init?: Partial<MinterEntity>) {
    super();
    Object.assign(this, init);
  }
}
