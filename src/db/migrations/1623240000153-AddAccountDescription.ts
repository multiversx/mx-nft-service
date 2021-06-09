import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAccountDescription1623240000153 implements MigrationInterface {
    name = 'AddAccountDescription1623240000153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `accounts` ADD `description` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `herotag`");
        await queryRunner.query("ALTER TABLE `accounts` ADD `herotag` varchar(62) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `herotag`");
        await queryRunner.query("ALTER TABLE `accounts` ADD `herotag` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `accounts` DROP COLUMN `description`");
    }

}
