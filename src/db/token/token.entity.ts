import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Tokens')
export class TokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 25 })
  tokenName: string;

  @Column({ length: 25 })
  tokenTicker: string;

  @Column({ nullable: true, length: 100 })
  tokenIdentifier: string;

  @Column({ length: 100 })
  owner: string;

  @Column('date')
  creationDate: Date = new Date(new Date().toUTCString());

  constructor(init?: Partial<TokenEntity>) {
    Object.assign(this, init);
  }
}
