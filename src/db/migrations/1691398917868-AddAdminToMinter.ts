import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminToMinter1691398917868 implements MigrationInterface {
  name = 'AddAdminToMinter1691398917868';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`minters\` ADD \`adminAddress\` varchar(62) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`minters\` DROP COLUMN \`adminAddress\``);
  }
}
