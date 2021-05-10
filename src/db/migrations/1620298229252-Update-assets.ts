import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateAssets1620298229252 implements MigrationInterface {
    name = 'UpdateAssets1620298229252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `Orders` (`orderId` int NOT NULL AUTO_INCREMENT, `priceTokenIdentifier` varchar(25) NOT NULL, `priceAmount` varchar(25) NOT NULL, `priceNonce` varchar(25) NOT NULL, `status` varchar(25) NOT NULL, `creationDate` date NOT NULL, `fromId` int NULL, `auctionAuctionId` int NULL, PRIMARY KEY (`orderId`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `Assets` (`id` int NOT NULL AUTO_INCREMENT, `tokenId` varchar(25) NOT NULL, `tokenNonce` varchar(255) NOT NULL, `name` varchar(25) NOT NULL, `hash` varchar(255) NOT NULL, `royalties` varchar(25) NOT NULL, `creationDate` date NOT NULL, `currentOwnerId` int NULL, `creatorId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `Orders` ADD CONSTRAINT `FK_88ab94629e3eb561868c04ab514` FOREIGN KEY (`fromId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `Orders` ADD CONSTRAINT `FK_e237996008b0bbe6a49f25b379b` FOREIGN KEY (`auctionAuctionId`) REFERENCES `Auction`(`auctionId`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `Assets` ADD CONSTRAINT `FK_07efc0dca8555dd825a7088ba4d` FOREIGN KEY (`currentOwnerId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `Assets` ADD CONSTRAINT `FK_73d76f5d429e4cdb27b1fe33f00` FOREIGN KEY (`creatorId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `Assets` DROP FOREIGN KEY `FK_73d76f5d429e4cdb27b1fe33f00`");
        await queryRunner.query("ALTER TABLE `Assets` DROP FOREIGN KEY `FK_07efc0dca8555dd825a7088ba4d`");
        await queryRunner.query("ALTER TABLE `Orders` DROP FOREIGN KEY `FK_e237996008b0bbe6a49f25b379b`");
        await queryRunner.query("ALTER TABLE `Orders` DROP FOREIGN KEY `FK_88ab94629e3eb561868c04ab514`");
        await queryRunner.query("DROP TABLE `Assets`");
        await queryRunner.query("DROP TABLE `Orders`");
    }

}
