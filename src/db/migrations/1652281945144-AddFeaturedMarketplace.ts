import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeaturedMarketplace1652281945144 implements MigrationInterface {
  name = 'AddFeaturedMarketplace1652281945144';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`featured_marketplaces\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`address\` varchar(62) NOT NULL, \`url\` varchar(255) NOT NULL, INDEX \`marketplace_address\` (\`address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`marketplace_address\` ON \`featured_marketplaces\``,
    );
    await queryRunner.query(`DROP TABLE \`featured_marketplaces\``);
  }
}
