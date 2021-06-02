import {MigrationInterface, QueryRunner} from "typeorm";

export class InitalMigration1622619286324 implements MigrationInterface {
    name = 'InitalMigration1622619286324'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `orders` (`id` int NOT NULL AUTO_INCREMENT, `creation_date` datetime NOT NULL, `modified_date` datetime NULL, `price_token_identifier` varchar(255) NOT NULL, `price_amount` varchar(255) NOT NULL, `price_nonce` varchar(255) NOT NULL, `status` varchar(255) NOT NULL, `owner_address` varchar(62) NOT NULL, `auction_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `followers` (`id` int NOT NULL AUTO_INCREMENT, `creation_date` datetime NOT NULL, `modified_date` datetime NULL, `followerId` int NULL, `followingId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `accounts` (`id` int NOT NULL AUTO_INCREMENT, `creation_date` datetime NOT NULL, `modified_date` datetime NULL, `address` varchar(62) NOT NULL, `profile_img_url` varchar(255) NOT NULL, `herotag` varchar(255) NOT NULL, UNIQUE INDEX `IDX_48ec5fcf335b99d4792dd5e453` (`address`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `auctions` (`id` int NOT NULL AUTO_INCREMENT, `creation_date` datetime NOT NULL, `modified_date` datetime NULL, `token_identifier` varchar(20) NOT NULL, `token_nonce` int NOT NULL, `status` varchar(255) NOT NULL, `payment_token_identifier` varchar(20) NOT NULL, `payment_nonce` int NOT NULL, `owner_address` varchar(62) NOT NULL, `min_bid` varchar(255) NOT NULL, `max_bid` varchar(255) NOT NULL, `start_date` varchar(255) NOT NULL, `end_date` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `followers` ADD CONSTRAINT `FK_451bb9eb792c3023a164cf14e0a` FOREIGN KEY (`followerId`) REFERENCES `accounts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `followers` ADD CONSTRAINT `FK_5e34418be6d904b779ca96cf932` FOREIGN KEY (`followingId`) REFERENCES `accounts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `followers` DROP FOREIGN KEY `FK_5e34418be6d904b779ca96cf932`");
        await queryRunner.query("ALTER TABLE `followers` DROP FOREIGN KEY `FK_451bb9eb792c3023a164cf14e0a`");
        await queryRunner.query("DROP TABLE `auctions`");
        await queryRunner.query("DROP INDEX `IDX_48ec5fcf335b99d4792dd5e453` ON `accounts`");
        await queryRunner.query("DROP TABLE `accounts`");
        await queryRunner.query("DROP TABLE `followers`");
        await queryRunner.query("DROP TABLE `orders`");
    }

}
