import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateAccount1618400841079 implements MigrationInterface {
  private accountsTable = new Table({
    name: 'accounts',
    columns: [
      {
        name: 'account_id',
        type: 'INTEGER',
        isPrimary: true,
        isGenerated: true,
        generationStrategy: 'increment',
      },
      {
        name: 'address',
        type: 'varchar',
        length: '255',
        isNullable: false,
      },
      {
        name: 'profile_img_url',
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
        name: 'from_id',
        type: 'INTEGER',
        isNullable: false,
      },
      {
        name: 'auction_id',
        type: 'INTEGER',
        isNullable: false,
      },
    ],
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(this.accountsTable);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.accountsTable);
  }
}
