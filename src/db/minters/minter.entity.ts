import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { WhitelistMinterRequest } from 'src/modules/minters/models/requests/whitelistMinterRequest';

@Entity('minters')
export class MinterEntity extends BaseEntity {
  @Column({ length: 62 })
  address: string;

  @Column({ length: 62 })
  adminAddress: string;

  @Column({ length: 20 })
  name: string;

  @Column()
  description: string;

  @Column({ length: 62 })
  royaltiesClaimAddress: string;

  @Column({ length: 62 })
  mintClaimAddress: string;

  @Column()
  maxNftsPerTransaction: number;

  static fromRequest(args: WhitelistMinterRequest) {
    return new MinterEntity({
      address: args.address,
      name: args.name,
      description: args.description,
      royaltiesClaimAddress: args.royaltiesClaimAddress,
      mintClaimAddress: args.mintClaimAddress,
      adminAddress: args.adminAddress,
      maxNftsPerTransaction: args.maxNftsPerTransaction,
    });
  }

  constructor(init?: Partial<MinterEntity>) {
    super();
    Object.assign(this, init);
  }
}
