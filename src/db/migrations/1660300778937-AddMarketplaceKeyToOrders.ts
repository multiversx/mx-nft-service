import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketplaceKeyToOrders1660300778937
  implements MigrationInterface
{
  name = 'AddMarketplaceKeyToOrders1660300778937';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`orders\` ADD \`marketplaceKey\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auctions\` ADD \`marketplaceAuctionId\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`marketplaces\` ADD \`type\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`order_marketplace_key\` ON \`orders\` (\`marketplaceKey\`)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`AuctionEntity_UQ_Marketplace\` ON \`auctions\` (\`marketplaceAuctionId\`, \`marketplaceKey\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`AuctionEntity_UQ_Marketplace\` ON \`auctions\``,
    );
    await queryRunner.query(
      `DROP INDEX \`order_marketplace_key\` ON \`orders\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`marketplaces\` DROP COLUMN \`type\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auctions\` DROP COLUMN \`marketplaceAuctionId\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP COLUMN \`marketplaceKey\``,
    );
  }
}
