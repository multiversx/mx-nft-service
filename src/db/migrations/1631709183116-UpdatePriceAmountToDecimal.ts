import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePriceAmountToDecimal1631709183116
  implements MigrationInterface
{
  name = 'UpdatePriceAmountToDecimal1631709183116';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `orders` ADD `priceAmountDenominated` decimal(36,18) NOT NULL DEFAULT '0.00'",
    );
    await queryRunner.query(
      'UPDATE `orders` SET `priceAmountDenominated` = CAST(`priceAmount` /1000000000000000000 as Decimal(36, 18))',
    );

    await queryRunner.query(
      "ALTER TABLE `auctions` ADD `minBidDenominated` decimal(36, 18) NOT NULL DEFAULT '0.00'",
    );
    await queryRunner.query(
      'UPDATE `auctions` SET `minBidDenominated` = CAST(`minBid` /1000000000000000000 as Decimal(36, 18))',
    );

    await queryRunner.query(
      "ALTER TABLE `auctions` ADD `maxBidDenominated` decimal(36,18) NOT NULL DEFAULT '0.00'",
    );
    await queryRunner.query(
      'UPDATE `auctions` SET `maxBidDenominated` = CAST(`maxBid` /1000000000000000000 as Decimal(36, 18))',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `orders` DROP `priceAmountDenominated`',
    );
    await queryRunner.query('ALTER TABLE `auctions` DROP `minBidDenominated`');
    await queryRunner.query('ALTER TABLE `auctions` DROP `maxBidDenominated`');
  }
}
