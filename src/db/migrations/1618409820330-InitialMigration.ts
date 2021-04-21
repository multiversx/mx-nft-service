import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1618409820330 implements MigrationInterface {
    name = 'InitialMigration1618409820330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `order_entity` DROP COLUMN `auctionId`");
        await queryRunner.query("ALTER TABLE `order_entity` DROP COLUMN `priceId`");
        await queryRunner.query("ALTER TABLE `order_entity` ADD `price` varchar(25) NOT NULL");
        await queryRunner.query("ALTER TABLE `order_entity` ADD `auctionAuctionId` int NULL");
        await queryRunner.query("ALTER TABLE `asset_entity` ADD `currentOwnerId` int NULL");
        await queryRunner.query("ALTER TABLE `asset_entity` ADD UNIQUE INDEX `IDX_9e427da18669afca577bc869ca` (`currentOwnerId`)");
        await queryRunner.query("ALTER TABLE `order_entity` DROP COLUMN `fromId`");
        await queryRunner.query("ALTER TABLE `order_entity` ADD `fromId` int NULL");
        await queryRunner.query("ALTER TABLE `auction_entity` DROP COLUMN `ownerId`");
        await queryRunner.query("ALTER TABLE `auction_entity` ADD `ownerId` int NULL");
        await queryRunner.query("ALTER TABLE `asset_entity` DROP COLUMN `creatorId`");
        await queryRunner.query("ALTER TABLE `asset_entity` ADD `creatorId` int NULL");
        await queryRunner.query("ALTER TABLE `asset_entity` ADD UNIQUE INDEX `IDX_11f3aaa167fbf7d869306b3f2f` (`creatorId`)");
        await queryRunner.query("CREATE UNIQUE INDEX `REL_9e427da18669afca577bc869ca` ON `asset_entity` (`currentOwnerId`)");
        await queryRunner.query("CREATE UNIQUE INDEX `REL_11f3aaa167fbf7d869306b3f2f` ON `asset_entity` (`creatorId`)");
        await queryRunner.query("ALTER TABLE `order_entity` ADD CONSTRAINT `FK_72a0ddba757533d26bc85f5d286` FOREIGN KEY (`fromId`) REFERENCES `account_entity`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `order_entity` ADD CONSTRAINT `FK_3f674f0e1dd3cdca380bb888335` FOREIGN KEY (`auctionAuctionId`) REFERENCES `auction_entity`(`auctionId`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `auction_entity` ADD CONSTRAINT `FK_90d819595fc359c120245dde836` FOREIGN KEY (`ownerId`) REFERENCES `account_entity`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `asset_entity` ADD CONSTRAINT `FK_9e427da18669afca577bc869ca0` FOREIGN KEY (`currentOwnerId`) REFERENCES `account_entity`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `asset_entity` ADD CONSTRAINT `FK_11f3aaa167fbf7d869306b3f2fa` FOREIGN KEY (`creatorId`) REFERENCES `account_entity`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `asset_entity` DROP FOREIGN KEY `FK_11f3aaa167fbf7d869306b3f2fa`");
        await queryRunner.query("ALTER TABLE `asset_entity` DROP FOREIGN KEY `FK_9e427da18669afca577bc869ca0`");
        await queryRunner.query("ALTER TABLE `auction_entity` DROP FOREIGN KEY `FK_90d819595fc359c120245dde836`");
        await queryRunner.query("ALTER TABLE `order_entity` DROP FOREIGN KEY `FK_3f674f0e1dd3cdca380bb888335`");
        await queryRunner.query("ALTER TABLE `order_entity` DROP FOREIGN KEY `FK_72a0ddba757533d26bc85f5d286`");
        await queryRunner.query("DROP INDEX `REL_11f3aaa167fbf7d869306b3f2f` ON `asset_entity`");
        await queryRunner.query("DROP INDEX `REL_9e427da18669afca577bc869ca` ON `asset_entity`");
        await queryRunner.query("ALTER TABLE `asset_entity` DROP INDEX `IDX_11f3aaa167fbf7d869306b3f2f`");
        await queryRunner.query("ALTER TABLE `asset_entity` DROP COLUMN `creatorId`");
        await queryRunner.query("ALTER TABLE `asset_entity` ADD `creatorId` tinyint NOT NULL");
        await queryRunner.query("ALTER TABLE `auction_entity` DROP COLUMN `ownerId`");
        await queryRunner.query("ALTER TABLE `auction_entity` ADD `ownerId` varchar(25) NOT NULL");
        await queryRunner.query("ALTER TABLE `order_entity` DROP COLUMN `fromId`");
        await queryRunner.query("ALTER TABLE `order_entity` ADD `fromId` varchar(25) NOT NULL");
        await queryRunner.query("ALTER TABLE `asset_entity` DROP INDEX `IDX_9e427da18669afca577bc869ca`");
        await queryRunner.query("ALTER TABLE `asset_entity` DROP COLUMN `currentOwnerId`");
        await queryRunner.query("ALTER TABLE `order_entity` DROP COLUMN `auctionAuctionId`");
        await queryRunner.query("ALTER TABLE `order_entity` DROP COLUMN `price`");
        await queryRunner.query("ALTER TABLE `order_entity` ADD `priceId` varchar(25) NOT NULL");
        await queryRunner.query("ALTER TABLE `order_entity` ADD `auctionId` varchar(25) NOT NULL");
    }

}
