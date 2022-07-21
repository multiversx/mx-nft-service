import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNftFlagsContraints1658409506198
  implements MigrationInterface
{
  name = 'UpdateNftFlagsContraints1658409506198';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`nft_flags_identifier\` ON \`nft_flags\` (\`identifier\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`nft_flags_identifier\` ON \`nft_flags\``,
    );
  }
}
