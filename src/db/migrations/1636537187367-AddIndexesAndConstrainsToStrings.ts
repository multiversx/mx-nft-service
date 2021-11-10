import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesAndConstrainsToStrings1636537187367
  implements MigrationInterface
{
  name = 'AddIndexesAndConstrainsToStrings1636537187367';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY COLUMN `priceToken` varchar(20) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY COLUMN `priceAmount` varchar(62) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY COLUMN  `status` varchar(8) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY COLUMN  `boughtTokensNo` varchar(62) NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `auctions` MODIFY COLUMN  `status` varchar(10) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `auctions` MODIFY COLUMN  `startDate` int NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `auctions` MODIFY COLUMN  `endDate` int NOT NULL',
    );
    await queryRunner.query(
      'CREATE INDEX `order_status` ON `orders` (`status`)',
    );
    await queryRunner.query(
      'CREATE INDEX `order_auction_id` ON `orders` (`auctionId`)',
    );
    await queryRunner.query(
      'CREATE INDEX `auction_status` ON `auctions` (`status`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `auction_status` ON `auctions`');
    await queryRunner.query('DROP INDEX `order_auction_id` ON `orders`');
    await queryRunner.query('DROP INDEX `order_status` ON `orders`');
    await queryRunner.query(
      'ALTER TABLE `auctions` MODIFY COLUMN  `endDate` varchar(255) CHARACTER SET "latin1" COLLATE "latin1_swedish_ci" NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `auctions` MODIFY COLUMN  `startDate` varchar(255) CHARACTER SET "latin1" COLLATE "latin1_swedish_ci" NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `auctions` MODIFY COLUMN  `status` varchar(255) CHARACTER SET "latin1" COLLATE "latin1_swedish_ci" NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY COLUMN  `boughtTokensNo` varchar(255) CHARACTER SET "latin1" COLLATE "latin1_swedish_ci" NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY COLUMN  `status` varchar(255) CHARACTER SET "latin1" COLLATE "latin1_swedish_ci" NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY COLUMN  `priceAmount` varchar(255) CHARACTER SET "latin1" COLLATE "latin1_swedish_ci" NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY COLUMN  `priceToken` varchar(255) CHARACTER SET "latin1" COLLATE "latin1_swedish_ci" NOT NULL',
    );
  }
}
