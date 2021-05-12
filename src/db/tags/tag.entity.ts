import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tags')
export class TagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'token_identifier' })
  tokenIdentifier: string;

  @Column()
  tag: string;

  constructor(init?: Partial<TagEntity>) {
    Object.assign(this, init);
  }
}
