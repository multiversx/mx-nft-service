import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMarketplaceEntity1695901759519 implements MigrationInterface {
  name = 'UpdateMarketplaceEntity1695901759519';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`marketplace-collections\` DROP FOREIGN KEY \`FK_57142b40198262e4ea27dbccbb9\``);
    await queryRunner.query(
      `CREATE TABLE \`marketplaces_collections_marketplace-collections\` (\`marketplacesId\` int NOT NULL, \`marketplaceCollectionsId\` int NOT NULL, INDEX \`IDX_2c311043b4f9765133b5e63316\` (\`marketplacesId\`), INDEX \`IDX_e998843b77fc1949410b98b8eb\` (\`marketplaceCollectionsId\`), PRIMARY KEY (\`marketplacesId\`, \`marketplaceCollectionsId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(`ALTER TABLE \`marketplace-collections\` DROP COLUMN \`marketplaceId\``);
    await queryRunner.query(
      `ALTER TABLE \`marketplaces_collections_marketplace-collections\` ADD CONSTRAINT \`FK_2c311043b4f9765133b5e633166\` FOREIGN KEY (\`marketplacesId\`) REFERENCES \`marketplaces\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`marketplaces_collections_marketplace-collections\` ADD CONSTRAINT \`FK_e998843b77fc1949410b98b8eb6\` FOREIGN KEY (\`marketplaceCollectionsId\`) REFERENCES \`marketplace-collections\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`marketplaces_collections_marketplace-collections\` DROP FOREIGN KEY \`FK_e998843b77fc1949410b98b8eb6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`marketplaces_collections_marketplace-collections\` DROP FOREIGN KEY \`FK_2c311043b4f9765133b5e633166\``,
    );
    await queryRunner.query(`ALTER TABLE \`marketplace-collections\` ADD \`marketplaceId\` int NULL`);
    await queryRunner.query(`DROP INDEX \`IDX_e998843b77fc1949410b98b8eb\` ON \`marketplaces_collections_marketplace-collections\``);
    await queryRunner.query(`DROP INDEX \`IDX_2c311043b4f9765133b5e63316\` ON \`marketplaces_collections_marketplace-collections\``);
    await queryRunner.query(`DROP TABLE \`marketplaces_collections_marketplace-collections\``);
    await queryRunner.query(
      `ALTER TABLE \`marketplace-collections\` ADD CONSTRAINT \`FK_57142b40198262e4ea27dbccbb9\` FOREIGN KEY (\`marketplaceId\`) REFERENCES \`marketplaces\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
