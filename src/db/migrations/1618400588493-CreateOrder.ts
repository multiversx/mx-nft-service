import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateOrder1618400588493 implements MigrationInterface {
  private ordersTable = new Table({
    name: 'orders',
    columns: [
      {
        name: 'order_id',
        type: 'INTEGER',
        isPrimary: true,
        isGenerated: true,
        generationStrategy: 'increment',
      },
      {
        name: 'price',
        type: 'varchar',
        length: '255',
        isNullable: false,
      },
      {
        name: 'status',
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
      //   {
      //     name: 'from_id',
      //     type: 'INTEGER',
      //     isNullable: false,
      //   },
      //   {
      //     name: 'auction_id',
      //     type: 'INTEGER',
      //     isNullable: false,
      //   },
    ],
  });
  //   private foreignKey = new TableForeignKey({
  //     columnNames: ['auction_id'],
  //     referencedColumnNames: ['id'],
  //     onDelete: 'CASCADE',
  //     referencedTableName: 'auctions',
  //   });

  //   private foreignKeyAccount = new TableForeignKey({
  //     columnNames: ['from_id'],
  //     referencedColumnNames: ['id'],
  //     onDelete: 'CASCADE',
  //     referencedTableName: 'accounts',
  //   });
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(this.ordersTable);
    // await queryRunner.createForeignKey('auctions', this.foreignKey);
    // await queryRunner.createForeignKey('accounts', this.foreignKeyAccount);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(this.ordersTable);
  }
}
