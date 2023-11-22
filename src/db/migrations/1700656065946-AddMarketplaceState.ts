import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketplaceState1700656065946 implements MigrationInterface {
  name = 'AddMarketplaceState1700656065946';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD \`state\` bit NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP COLUMN \`state\``);
  }
}
