import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameForMarketplace1652687315493 implements MigrationInterface {
  name = 'AddNameForMarketplace1652687315493';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`featured_marketplaces\` ADD \`name\` varchar(62) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`featured_marketplaces\` DROP COLUMN \`name\``,
    );
  }
}
