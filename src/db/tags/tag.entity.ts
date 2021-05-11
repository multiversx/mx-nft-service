import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Tags')
export class TagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tokenIdentifier: string;

  @Column()
  tag: string;

  constructor(init?: Partial<TagEntity>) {
    Object.assign(this, init);
  }
}
