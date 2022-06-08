import {MigrationInterface, QueryRunner} from "typeorm";

export class AddWhitelistTimestamp1653575822884 implements MigrationInterface {
    name = 'AddWhitelistTimestamp1653575822884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`campaigns\` ADD \`whitelistExpireTimestamp\` int NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`campaigns\` DROP COLUMN \`whitelistExpireTimestamp\``);
    }

}
