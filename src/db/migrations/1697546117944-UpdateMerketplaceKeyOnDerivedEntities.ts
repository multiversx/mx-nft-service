import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMerketplaceKeyOnDerivedEntities1697546117944 implements MigrationInterface {
  name = 'UpdateMerketplaceKeyOnDerivedEntities1697546117944';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`order_marketplace_key\` ON \`orders\``);
    await queryRunner.query(`ALTER TABLE \`orders\` MODIFY COLUMN \`marketplaceKey\` varchar(62) NOT NULL`);
    await queryRunner.query(`DROP INDEX \`AuctionEntity_UQ_Marketplace\` ON \`auctions\``);
    await queryRunner.query(`DROP INDEX \`auction_marketplace_key\` ON \`auctions\``);
    await queryRunner.query(`ALTER TABLE \`auctions\` MODIFY COLUMN \`marketplaceKey\` varchar(62) NOT NULL`);
    await queryRunner.query(`DROP INDEX \`notification_marketplace_key\` ON \`notifications\``);
    await queryRunner.query(`ALTER TABLE \`notifications\` MODIFY COLUMN \`marketplaceKey\` varchar(62) NOT NULL`);
    await queryRunner.query(`DROP INDEX \`OfferEntity_UQ_Marketplace\` ON \`offers\``);
    await queryRunner.query(`DROP INDEX \`offer_marketplace_key\` ON \`offers\``);
    await queryRunner.query(`ALTER TABLE \`offers\` MODIFY COLUMN \`marketplaceKey\` varchar(62) NOT NULL`);
    await queryRunner.query(`CREATE INDEX \`order_marketplace_key\` ON \`orders\` (\`marketplaceKey\`)`);
    await queryRunner.query(`CREATE INDEX \`auction_marketplace_key\` ON \`auctions\` (\`marketplaceKey\`)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`AuctionEntity_UQ_Marketplace\` ON \`auctions\` (\`marketplaceAuctionId\`, \`marketplaceKey\`)`,
    );
    await queryRunner.query(`CREATE INDEX \`notification_marketplace_key\` ON \`notifications\` (\`marketplaceKey\`)`);
    await queryRunner.query(`CREATE INDEX \`offer_marketplace_key\` ON \`offers\` (\`marketplaceKey\`)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`OfferEntity_UQ_Marketplace\` ON \`offers\` (\`marketplaceOfferId\`, \`marketplaceKey\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`OfferEntity_UQ_Marketplace\` ON \`offers\``);
    await queryRunner.query(`DROP INDEX \`offer_marketplace_key\` ON \`offers\``);
    await queryRunner.query(`DROP INDEX \`notification_marketplace_key\` ON \`notifications\``);
    await queryRunner.query(`DROP INDEX \`AuctionEntity_UQ_Marketplace\` ON \`auctions\``);
    await queryRunner.query(`DROP INDEX \`auction_marketplace_key\` ON \`auctions\``);
    await queryRunner.query(`DROP INDEX \`order_marketplace_key\` ON \`orders\``);
    await queryRunner.query(`ALTER TABLE \`offers\` MODIFY COLUMN \`marketplaceKey\` varchar(20) NOT NULL`);
    await queryRunner.query(`CREATE INDEX \`offer_marketplace_key\` ON \`offers\` (\`marketplaceKey\`)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`OfferEntity_UQ_Marketplace\` ON \`offers\` (\`marketplaceOfferId\`, \`marketplaceKey\`)`,
    );
    await queryRunner.query(`ALTER TABLE \`notifications\` MODIFY COLUMN \`marketplaceKey\` varchar(20) NOT NULL`);
    await queryRunner.query(`CREATE INDEX \`notification_marketplace_key\` ON \`notifications\` (\`marketplaceKey\`)`);
    await queryRunner.query(`ALTER TABLE \`auctions\` MODIFY COLUMN \`marketplaceKey\` varchar(20) NOT NULL`);
    await queryRunner.query(`CREATE INDEX \`auction_marketplace_key\` ON \`auctions\` (\`marketplaceKey\`)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`AuctionEntity_UQ_Marketplace\` ON \`auctions\` (\`marketplaceAuctionId\`, \`marketplaceKey\`)`,
    );
    await queryRunner.query(`ALTER TABLE \`orders\` MODIFY COLUMN \`marketplaceKey\` varchar(20) NOT NULL`);
    await queryRunner.query(`CREATE INDEX \`order_marketplace_key\` ON \`orders\` (\`marketplaceKey\`)`);
  }
}
