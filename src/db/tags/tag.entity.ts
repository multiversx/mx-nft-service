import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('tags')
export class TagEntity extends BaseEntity {
  @Column({ name: 'token_identifier' })
  tokenIdentifier: string;

  @Column()
  tag: string;

  constructor(init?: Partial<TagEntity>) {
    super();
    Object.assign(this, init);
  }
}
