import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMarketplaceKeyLength1696854100026 implements MigrationInterface {
  name = 'UpdateMarketplaceKeyLength1696854100026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplaces\` MODIFY COLUMN \`key\` varchar(62) NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplaces\` MODIFY COLUMN \`key\` varchar(20) NOT NULL`);
  }
}
