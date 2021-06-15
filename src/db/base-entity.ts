import { Column, PrimaryGeneratedColumn } from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  creationDate: Date = new Date(new Date().toUTCString());

  @Column({ nullable: true })
  modifiedDate: Date;
}
