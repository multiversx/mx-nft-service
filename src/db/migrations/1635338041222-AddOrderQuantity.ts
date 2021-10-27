import {MigrationInterface, QueryRunner} from "typeorm";

export class AddOrderQuantity1635338041222 implements MigrationInterface {
    name = 'AddOrderQuantity1635338041222'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `orders` ADD `boughtTokensNo` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `orders` DROP COLUMN `boughtTokensNo`");
    }

}
