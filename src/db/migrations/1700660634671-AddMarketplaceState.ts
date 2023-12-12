import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketplaceState1700660634671 implements MigrationInterface {
  name = 'AddMarketplaceState1700660634671';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD \`state\` varchar(10) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP COLUMN \`state\``);
  }
}
