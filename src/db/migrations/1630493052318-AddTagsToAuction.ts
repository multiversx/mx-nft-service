import {MigrationInterface, QueryRunner} from "typeorm";

export class AddTagsToAuction1630493052318 implements MigrationInterface {
    name = 'AddTagsToAuction1630493052318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` ADD `tags` varchar(255) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `tags`");
    }

}
