import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateTablesPropertiesToMatchDto1623683227538 implements MigrationInterface {
    name = 'UpdateTablesPropertiesToMatchDto1623683227538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `followers` DROP COLUMN `creation_date`");
        await queryRunner.query("ALTER TABLE `followers` DROP COLUMN `modified_date`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `creation_date`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `modified_date`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `price_amount`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `owner_address`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `auction_id`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `price_token`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `price_nonce`");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `creation_date`");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `modified_date`");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `profile_img_url`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `creation_date`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `modified_date`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `payment_nonce`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `owner_address`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `min_bid`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `max_bid`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `start_date`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `end_date`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `payment_token`");
        await queryRunner.query("ALTER TABLE `followers` ADD `creationDate` datetime NOT NULL");
        await queryRunner.query("ALTER TABLE `followers` ADD `modifiedDate` datetime NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `creationDate` datetime NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `modifiedDate` datetime NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `priceToken` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `priceAmount` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `priceNonce` int NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `ownerAddress` varchar(62) NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `auctionId` int NOT NULL");
        await queryRunner.query("ALTER TABLE `accounts` ADD `creationDate` datetime NOT NULL");
        await queryRunner.query("ALTER TABLE `accounts` ADD `modifiedDate` datetime NULL");
        await queryRunner.query("ALTER TABLE `accounts` ADD `profileImgUrl` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `creationDate` datetime NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `modifiedDate` datetime NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `paymentToken` varchar(20) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `paymentNonce` int NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `ownerAddress` varchar(62) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `minBid` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `maxBid` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `startDate` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `endDate` varchar(255) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `endDate`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `startDate`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `maxBid`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `minBid`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `ownerAddress`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `paymentNonce`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `paymentToken`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `modifiedDate`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `creationDate`");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `profileImgUrl`");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `modifiedDate`");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `creationDate`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `auctionId`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `ownerAddress`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `priceNonce`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `priceAmount`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `priceToken`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `modifiedDate`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `creationDate`");
        await queryRunner.query("ALTER TABLE `followers` DROP COLUMN `modifiedDate`");
        await queryRunner.query("ALTER TABLE `followers` DROP COLUMN `creationDate`");
        await queryRunner.query("ALTER TABLE `auctions` ADD `payment_token` varchar(20) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `end_date` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `start_date` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `max_bid` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `min_bid` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `owner_address` varchar(62) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `payment_nonce` int NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `modified_date` datetime NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `creation_date` datetime NOT NULL");
        await queryRunner.query("ALTER TABLE `accounts` ADD `profile_img_url` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `accounts` ADD `modified_date` datetime NULL");
        await queryRunner.query("ALTER TABLE `accounts` ADD `creation_date` datetime NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `price_nonce` int NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `price_token` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `auction_id` int NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `owner_address` varchar(62) NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `price_amount` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `modified_date` datetime NULL");
        await queryRunner.query("ALTER TABLE `orders` ADD `creation_date` datetime NOT NULL");
        await queryRunner.query("ALTER TABLE `followers` ADD `modified_date` datetime NULL");
        await queryRunner.query("ALTER TABLE `followers` ADD `creation_date` datetime NOT NULL");
    }

}
