import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOfferEndDate1671633959839 implements MigrationInterface {
  name = 'AddOfferEndDate1671633959839';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`offers\` ADD \`endDate\` int NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`offer_end_date\` ON \`offers\` (\`endDate\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`offer_end_date\` ON \`offers\``);
    await queryRunner.query(`ALTER TABLE \`offers\` DROP COLUMN \`endDate\``);
  }
}
