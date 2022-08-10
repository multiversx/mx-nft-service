import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../base-entity';
import { SubdomainCollectionEntity } from './subdomain-collection.entity';

@Entity('subdomains')
export class SubdomainEntity extends BaseEntity {
  @Column({ length: 50 })
  name: string;

  @Column()
  url: string;

  @OneToMany(
    () => SubdomainCollectionEntity,
    (collection) => collection.subdomain,
  )
  collections: SubdomainCollectionEntity[];

  constructor(init?: Partial<SubdomainEntity>) {
    super();
    Object.assign(this, init);
  }
}
