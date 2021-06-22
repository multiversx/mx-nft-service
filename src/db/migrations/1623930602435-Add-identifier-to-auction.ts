import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIdentifierToAuction1623930602435 implements MigrationInterface {
    name = 'AddIdentifierToAuction1623930602435'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` ADD `identifier` varchar(30) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `identifier`");
    }

}
