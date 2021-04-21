import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAsset1618399832633 implements MigrationInterface {
  private assetTable = new Table({
    name: 'assets',
    columns: [
      {
        name: 'asset_id',
        type: 'INTEGER',
        isPrimary: true,
        isGenerated: true,
        generationStrategy: 'increment',
      },
      {
        name: 'name',
        type: 'varchar',
        length: '255',
        isNullable: false,
      },
      {
        name: 'tokenId',
        type: 'varchar',
        length: '255',
        isNullable: false,
      },
      {
        name: 'royalties',
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
        name: 'owner_id',
        type: 'INTEGER',
        isNullable: false,
      },
      {
        name: 'creator_id',
        type: 'INTEGER',
        isNullable: false,
      },
    ],
  });
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(this.assetTable);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.assetTable);
  }
}
