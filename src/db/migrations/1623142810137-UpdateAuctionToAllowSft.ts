import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateAuctionToAllowSft1623142810137 implements MigrationInterface {
    name = 'UpdateAuctionToAllowSft1623142810137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` ADD `type` varchar(255) NOT NULL");
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
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `type`");
    }

}
