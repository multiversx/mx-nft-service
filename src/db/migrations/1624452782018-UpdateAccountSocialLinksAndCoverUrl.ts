import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAccountSocialLinksAndCoverUrl1624452782018
  implements MigrationInterface
{
  name = 'UpdateAccountSocialLinksAndCoverUrl1624452782018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `social_links` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(25) NOT NULL, `iconName` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
    await queryRunner.query(
      'CREATE TABLE `accounts_social_links_social_links` (`accountsId` int NOT NULL, `socialLinksId` int NOT NULL, INDEX `IDX_7163a3f91c3f5061cb41858184` (`accountsId`), INDEX `IDX_f09bc6ff2c83dad07af8d5d7f2` (`socialLinksId`), PRIMARY KEY (`accountsId`, `socialLinksId`)) ENGINE=InnoDB',
    );
    await queryRunner.query(
      'ALTER TABLE `accounts` ADD `coverImgUrl` varchar(255) NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `accounts` CHANGE `description` `description` varchar(255) NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `accounts` CHANGE `profileImgUrl` `profileImgUrl` varchar(255) NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `accounts_social_links_social_links` ADD CONSTRAINT `FK_7163a3f91c3f5061cb41858184c` FOREIGN KEY (`accountsId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    );
    await queryRunner.query(
      'ALTER TABLE `accounts_social_links_social_links` ADD CONSTRAINT `FK_f09bc6ff2c83dad07af8d5d7f25` FOREIGN KEY (`socialLinksId`) REFERENCES `social_links`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `accounts_social_links_social_links` DROP FOREIGN KEY `FK_f09bc6ff2c83dad07af8d5d7f25`',
    );
    await queryRunner.query(
      'ALTER TABLE `accounts_social_links_social_links` DROP FOREIGN KEY `FK_7163a3f91c3f5061cb41858184c`',
    );
    await queryRunner.query(
      'ALTER TABLE `accounts` CHANGE `profileImgUrl` `profileImgUrl` varchar(255) NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `accounts` CHANGE `description` `description` varchar(255) NOT NULL',
    );
    await queryRunner.query('ALTER TABLE `accounts` DROP COLUMN `coverImgUrl`');
    await queryRunner.query(
      'DROP INDEX `IDX_f09bc6ff2c83dad07af8d5d7f2` ON `accounts_social_links_social_links`',
    );
    await queryRunner.query(
      'DROP INDEX `IDX_7163a3f91c3f5061cb41858184` ON `accounts_social_links_social_links`',
    );
    await queryRunner.query('DROP TABLE `accounts_social_links_social_links`');
    await queryRunner.query('DROP TABLE `social_links`');
  }
}
