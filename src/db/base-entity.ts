import { Column, PrimaryGeneratedColumn } from 'typeorm';

export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'creation_date' })
  creationDate: Date = new Date(new Date().toUTCString());

  @Column({ name: 'modified_date', nullable: true })
  modifiedDate: Date;
}
