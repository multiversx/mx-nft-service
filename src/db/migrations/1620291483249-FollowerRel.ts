import {MigrationInterface, QueryRunner} from "typeorm";

export class FollowerRel1620291483249 implements MigrationInterface {
    name = 'FollowerRel1620291483249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `Account` CHANGE `username` `herotag` varchar(25) NOT NULL");
        await queryRunner.query("CREATE TABLE `Followers` (`id` int NOT NULL AUTO_INCREMENT, `followerId` int NULL, `followingId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `Token` ADD `tokenIdentifier` varchar(100) NULL");
        await queryRunner.query("ALTER TABLE `Followers` ADD CONSTRAINT `FK_cccee741c1cf2e3dfe04a00b1f7` FOREIGN KEY (`followerId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `Followers` ADD CONSTRAINT `FK_7e5534426a889bed0b9190f5fcb` FOREIGN KEY (`followingId`) REFERENCES `Account`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `Followers` DROP FOREIGN KEY `FK_7e5534426a889bed0b9190f5fcb`");
        await queryRunner.query("ALTER TABLE `Followers` DROP FOREIGN KEY `FK_cccee741c1cf2e3dfe04a00b1f7`");
        await queryRunner.query("ALTER TABLE `Token` DROP COLUMN `tokenIdentifier`");
        await queryRunner.query("DROP TABLE `Followers`");
        await queryRunner.query("ALTER TABLE `Account` CHANGE `herotag` `username` varchar(25) NOT NULL");
    }

}
