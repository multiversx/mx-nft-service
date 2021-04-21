import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAuction1618403370511 implements MigrationInterface {
  private auctionsTable = new Table({
    name: 'auctions',
    columns: [
      {
        name: 'aution_id',
        type: 'INTEGER',
        isPrimary: true,
        isGenerated: true,
        generationStrategy: 'increment',
      },
      {
        name: 'minBid',
        type: 'varchar',
        length: '255',
        isNullable: false,
      },
      {
        name: 'maxBid',
        type: 'varchar',
        length: '255',
        isNullable: false,
      },
      {
        name: 'created_at',
        type: 'timestamptz',
        isNullable: false,
        default: 'now()',
      },
      {
        name: 'start_date',
        type: 'timestamptz',
        isNullable: false,
        default: 'now()',
      },
      {
        name: 'end_date',
        type: 'timestamptz',
        isNullable: false,
        default: 'now()',
      },
    ],
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(this.auctionsTable);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.auctionsTable);
  }
}
