import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMinBidDifference1649168786182 implements MigrationInterface {
    name = 'AddMinBidDifference1649168786182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auctions\` ADD \`minBidDiff\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auctions\` DROP COLUMN \`minBidDiff\``);
    }

}
