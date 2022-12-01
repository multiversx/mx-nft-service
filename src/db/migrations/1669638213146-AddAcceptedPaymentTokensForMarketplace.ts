import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAcceptedPaymentTokensForMarketplace1669638213146 implements MigrationInterface {
    name = 'AddAcceptedPaymentTokensForMarketplace1669638213146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD \`acceptedPaymentTokens\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP COLUMN \`acceptedPaymentTokens\``);
    }

}
