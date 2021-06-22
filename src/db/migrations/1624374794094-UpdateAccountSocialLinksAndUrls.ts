import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateAccountSocialLinksAndUrls1624374794094 implements MigrationInterface {
    name = 'UpdateAccountSocialLinksAndUrls1624374794094'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `social_links` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(25) NOT NULL, `iconName` varchar(255) NOT NULL, `accountsId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `social_links_accounts` (`id` int NOT NULL AUTO_INCREMENT, `creationDate` datetime NOT NULL, `modifiedDate` datetime NULL, `socialLinkId` int NULL, `accountId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `accounts` ADD `coverImgUrl` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `accounts` CHANGE `description` `description` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `accounts` CHANGE `profileImgUrl` `profileImgUrl` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `social_links` ADD CONSTRAINT `FK_d6eff2ede1e34380173979608b4` FOREIGN KEY (`accountsId`) REFERENCES `accounts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `social_links_accounts` ADD CONSTRAINT `FK_3be9e9e684f1bcf92b440016552` FOREIGN KEY (`socialLinkId`) REFERENCES `social_links`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `social_links_accounts` ADD CONSTRAINT `FK_3f0891d79e57862890c37763ceb` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `social_links_accounts` DROP FOREIGN KEY `FK_3f0891d79e57862890c37763ceb`");
        await queryRunner.query("ALTER TABLE `social_links_accounts` DROP FOREIGN KEY `FK_3be9e9e684f1bcf92b440016552`");
        await queryRunner.query("ALTER TABLE `social_links` DROP FOREIGN KEY `FK_d6eff2ede1e34380173979608b4`");
        await queryRunner.query("ALTER TABLE `accounts` CHANGE `profileImgUrl` `profileImgUrl` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `accounts` CHANGE `description` `description` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `coverImgUrl`");
        await queryRunner.query("DROP TABLE `social_links_accounts`");
        await queryRunner.query("DROP TABLE `social_links`");
    }

}
