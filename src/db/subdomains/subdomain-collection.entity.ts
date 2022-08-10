import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { SubdomainEntity } from './subdomain.entity';

@Entity('subdomain-collections')
export class SubdomainCollectionEntity extends BaseEntity {
  @Column({ length: 20 })
  collectionIdentifier: string;

  @Column({ length: 20 })
  collectionName: string;

  @ManyToOne(() => SubdomainEntity, (subdomain) => subdomain.collections)
  @JoinColumn({ name: 'subdomainId', referencedColumnName: 'id' })
  subdomain: SubdomainEntity;

  constructor(init?: Partial<SubdomainCollectionEntity>) {
    super();
    Object.assign(this, init);
  }
}
