import {MigrationInterface, QueryRunner} from "typeorm";

export class AddNameForNotifications1657528839038 implements MigrationInterface {
    name = 'AddNameForNotifications1657528839038'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD \`name\` varchar(62) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`identifier\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD \`identifier\` varchar(25) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`identifier\``);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD \`identifier\` varchar(62) NULL`);
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP COLUMN \`name\``);
    }

}
