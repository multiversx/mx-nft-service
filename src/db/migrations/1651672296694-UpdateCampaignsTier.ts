import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateCampaignsTier1651672296694 implements MigrationInterface {
    name = 'UpdateCampaignsTier1651672296694'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`campaigns\` DROP COLUMN \`availableNfts\``);
        await queryRunner.query(`ALTER TABLE \`campaigns\` DROP COLUMN \`mintToken\``);
        await queryRunner.query(`ALTER TABLE \`campaigns\` DROP COLUMN \`totalNfts\``);
        await queryRunner.query(`ALTER TABLE \`tiers\` ADD \`mintToken\` varchar(20) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tiers\` DROP COLUMN \`mintToken\``);
        await queryRunner.query(`ALTER TABLE \`campaigns\` ADD \`totalNfts\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`campaigns\` ADD \`mintToken\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`campaigns\` ADD \`availableNfts\` int NOT NULL`);
    }

}
