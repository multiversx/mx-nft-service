import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketplaceCollections1660131647313
  implements MigrationInterface
{
  name = 'AddMarketplaceCollections1660131647313';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`marketplace_address\` ON \`featured_marketplaces\``,
    );
    await queryRunner.query(`DROP TABLE \`featured_marketplaces\``);
    await queryRunner.query(
      `CREATE TABLE \`marketplaces\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`address\` varchar(62) NOT NULL, \`name\` varchar(62) NOT NULL, \`url\` varchar(255) NOT NULL, INDEX \`marketplace_address\` (\`address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`marketplace-collections\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`collectionIdentifier\` varchar(20) NOT NULL, \`collectionName\` varchar(20) NOT NULL, \`marketplaceId\` int NULL, INDEX \`marketplace_collection\` (\`collectionIdentifier\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`marketplace-collections\` ADD CONSTRAINT \`FK_57142b40198262e4ea27dbccbb9\` FOREIGN KEY (\`marketplaceId\`) REFERENCES \`marketplaces\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`featured_marketplaces\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`address\` varchar(62) NOT NULL, \`url\` varchar(255) NOT NULL, INDEX \`marketplace_address\` (\`address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`marketplace-collections\` DROP FOREIGN KEY \`FK_57142b40198262e4ea27dbccbb9\``,
    );
    await queryRunner.query(
      `DROP INDEX \`marketplace_collection\` ON \`marketplace-collections\``,
    );
    await queryRunner.query(`DROP TABLE \`marketplace-collections\``);
    await queryRunner.query(
      `DROP INDEX \`marketplace_address\` ON \`marketplaces\``,
    );
    await queryRunner.query(`DROP TABLE \`marketplaces\``);
  }
}
