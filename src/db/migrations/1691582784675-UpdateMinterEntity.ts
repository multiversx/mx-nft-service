import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMinterEntity1691582784675 implements MigrationInterface {
  name = 'UpdateMinterEntity1691582784675';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`minters\` DROP COLUMN \`name\``);
    await queryRunner.query(`ALTER TABLE \`minters\` DROP COLUMN \`description\``);
    await queryRunner.query(`ALTER TABLE \`minters\` DROP COLUMN \`royaltiesClaimAddress\``);
    await queryRunner.query(`ALTER TABLE \`minters\` DROP COLUMN \`mintClaimAddress\``);
    await queryRunner.query(`ALTER TABLE \`minters\` DROP COLUMN \`maxNftsPerTransaction\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`minters\` ADD \`maxNftsPerTransaction\` int NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`minters\` ADD \`mintClaimAddress\` varchar(62) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`minters\` ADD \`royaltiesClaimAddress\` varchar(62) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`minters\` ADD \`description\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`minters\` ADD \`name\` varchar(20) NOT NULL`);
  }
}
