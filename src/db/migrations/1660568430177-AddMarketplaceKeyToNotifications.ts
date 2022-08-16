import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketplaceKeyToNotifications1660568430177
  implements MigrationInterface
{
  name = 'AddMarketplaceKeyToNotifications1660568430177';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`notifications\` ADD \`marketplaceKey\` varchar(20) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`notification_marketplace_key\` ON \`notifications\` (\`marketplaceKey\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`notification_marketplace_key\` ON \`notifications\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notifications\` DROP COLUMN \`marketplaceKey\``,
    );
  }
}
