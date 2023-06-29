import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMintersEntity1688034800257 implements MigrationInterface {
  name = 'AddMintersEntity1688034800257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`minters\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`address\` varchar(62) NOT NULL, \`name\` varchar(20) NOT NULL, \`description\` varchar(255) NOT NULL, \`royaltiesClaimAddress\` varchar(62) NOT NULL, \`mintClaimAddress\` varchar(62) NOT NULL, \`maxNftsPerTransaction\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`minters\``);
  }
}
