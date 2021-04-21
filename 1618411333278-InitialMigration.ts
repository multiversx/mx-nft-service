import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1618411333278 implements MigrationInterface {
    name = 'InitialMigration1618411333278'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `Order` (`orderId` int NOT NULL AUTO_INCREMENT, `price` varchar(25) NOT NULL, `status` varchar(25) NOT NULL, `creationDate` date NOT NULL, `fromId` int NULL, `auctionAuctionId` int NULL, PRIMARY KEY (`orderId`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `Auction` (`auctionId` int NOT NULL AUTO_INCREMENT, `assetId` varchar(25) NOT NULL, `minBid` varchar(25) NOT NULL, `maxBid` varchar(25) NOT NULL, `creationDate` date NOT NULL, `startDate` date NOT NULL, `endDate` date NOT NULL, `ownerId` int NULL, PRIMARY KEY (`auctionId`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `Account` (`id` int NOT NULL AUTO_INCREMENT, `address` varchar(25) NOT NULL, `profileImgUrl` varchar(25) NOT NULL, `username` varchar(25) NOT NULL, `creationDate` date NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `Asset` (`id` int NOT NULL AUTO_INCREMENT, `tokenId` varchar(25) NOT NULL, `name` varchar(25) NOT NULL, `royalties` varchar(25) NOT NULL, `creationDate` date NOT NULL, `tokenNonce` varchar(255) NOT NULL, `currentOwnerId` int NULL, `creatorId` int NULL, UNIQUE INDEX `REL_05629eebbda7862de73fa5c873` (`currentOwnerId`), UNIQUE INDEX `REL_f69482c8f0f0c5cb1016e3810f` (`creatorId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `Order` ADD CONSTRAINT `FK_1f45824febed26b5797dee17af2` FOREIGN KEY (`fromId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `Order` ADD CONSTRAINT `FK_e3a3cae203972bc3a340a58ca3d` FOREIGN KEY (`auctionAuctionId`) REFERENCES `Auction`(`auctionId`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `Auction` ADD CONSTRAINT `FK_8f517c38af3ebddfdd81c15a0c3` FOREIGN KEY (`ownerId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `Asset` ADD CONSTRAINT `FK_05629eebbda7862de73fa5c8737` FOREIGN KEY (`currentOwnerId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `Asset` ADD CONSTRAINT `FK_f69482c8f0f0c5cb1016e3810f4` FOREIGN KEY (`creatorId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `Asset` DROP FOREIGN KEY `FK_f69482c8f0f0c5cb1016e3810f4`");
        await queryRunner.query("ALTER TABLE `Asset` DROP FOREIGN KEY `FK_05629eebbda7862de73fa5c8737`");
        await queryRunner.query("ALTER TABLE `Auction` DROP FOREIGN KEY `FK_8f517c38af3ebddfdd81c15a0c3`");
        await queryRunner.query("ALTER TABLE `Order` DROP FOREIGN KEY `FK_e3a3cae203972bc3a340a58ca3d`");
        await queryRunner.query("ALTER TABLE `Order` DROP FOREIGN KEY `FK_1f45824febed26b5797dee17af2`");
        await queryRunner.query("DROP INDEX `REL_f69482c8f0f0c5cb1016e3810f` ON `Asset`");
        await queryRunner.query("DROP INDEX `REL_05629eebbda7862de73fa5c873` ON `Asset`");
        await queryRunner.query("DROP TABLE `Asset`");
        await queryRunner.query("DROP TABLE `Account`");
        await queryRunner.query("DROP TABLE `Auction`");
        await queryRunner.query("DROP TABLE `Order`");
    }

}
