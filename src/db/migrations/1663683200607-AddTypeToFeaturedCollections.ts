import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTypeToFeaturedCollections1663683200607
  implements MigrationInterface
{
  name = 'AddTypeToFeaturedCollections1663683200607';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`featured_collections\` ADD \`type\` varchar(25) NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_076b967d38f0982b3433a784b3\` ON \`featured_collections\` (\`type\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`IDX_076b967d38f0982b3433a784b3\` ON \`featured_collections\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`featured_collections\` DROP COLUMN \`type\``,
    );
  }
}
