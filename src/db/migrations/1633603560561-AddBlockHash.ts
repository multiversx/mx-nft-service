import {MigrationInterface, QueryRunner} from "typeorm";

export class AddBlockHash1633603560561 implements MigrationInterface {
    name = 'AddBlockHash1633603560561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `orders` ADD `blockHash` varchar(64) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `blockHash` varchar(64) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `blockHash`");
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `blockHash`");
    }

}
