import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketplaceState1700659694771 implements MigrationInterface {
  name = 'AddMarketplaceState1700659694771';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD \`state\` tinyint NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP COLUMN \`state\``);
  }
}
