import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNftRarityEntity1656508949650 implements MigrationInterface {
  name = 'AddNftRarityEntity1656508949650';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`nft_rarities\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`collection\` varchar(20) NOT NULL, \`identifier\` varchar(30) NOT NULL, \`score\` decimal(6,3) NOT NULL, \`nonce\` int NOT NULL, \`rank\` int NOT NULL, INDEX \`rarity_collection\` (\`collection\`), INDEX \`rarity_identifier\` (\`identifier\`), UNIQUE INDEX \`NftRarityEntity_UQ_RARITY\` (\`collection\`, \`identifier\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`NftRarityEntity_UQ_RARITY\` ON \`nft_rarities\``,
    );
    await queryRunner.query(
      `DROP INDEX \`rarity_identifier\` ON \`nft_rarities\``,
    );
    await queryRunner.query(
      `DROP INDEX \`rarity_collection\` ON \`nft_rarities\``,
    );
    await queryRunner.query(`DROP TABLE \`nft_rarities\``);
  }
}
