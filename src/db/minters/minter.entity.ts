import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base-entity';

@Entity('minters')
export class MinterEntity extends BaseEntity {
  @Column({ length: 62 })
  address: string;

  @Column({ length: 20 })
  name: string;

  @Column()
  description: string;

  constructor(init?: Partial<MinterEntity>) {
    super();
    Object.assign(this, init);
  }
}
