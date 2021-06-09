import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateAuctionTableForSfts1623230092701 implements MigrationInterface {
    name = 'UpdateAuctionTableForSfts1623230092701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `price_token_identifier`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `payment_token_identifier`");
        await queryRunner.query("ALTER TABLE `orders` ADD `price_token` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `type` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `payment_token` varchar(20) NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `price_nonce`");
        await queryRunner.query("ALTER TABLE `orders` ADD `price_nonce` int NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` CHANGE `id` `id` int NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` DROP PRIMARY KEY");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `id`");
        await queryRunner.query("ALTER TABLE `auctions` ADD `id` int NOT NULL PRIMARY KEY");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `id`");
        await queryRunner.query("ALTER TABLE `auctions` ADD `id` int NOT NULL AUTO_INCREMENT");
        await queryRunner.query("ALTER TABLE `auctions` ADD PRIMARY KEY (`id`)");
        await queryRunner.query("ALTER TABLE `auctions` CHANGE `id` `id` int NOT NULL AUTO_INCREMENT");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `price_nonce`");
        await queryRunner.query("ALTER TABLE `orders` ADD `price_nonce` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `payment_token`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `type`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `price_token`");
        await queryRunner.query("ALTER TABLE `auctions` ADD `payment_token_identifier` varchar(20) NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `price_token_identifier` varchar(255) NOT NULL");
    }

}
