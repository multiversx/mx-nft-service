import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCampaignsAndTiers1651747398282
  implements MigrationInterface
{
  name = 'UpdateCampaignsAndTiers1651747398282';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`tiers\` ADD \`description\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`campaigns\` ADD \`maxNftsPerTransaction\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`campaigns\` ADD \`verified\` int NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`campaigns\` ADD \`description\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tiers\` DROP FOREIGN KEY \`FK_ef795e5bc1202f220836dc62dbd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tier_details\` DROP FOREIGN KEY \`FK_bd354b8c8e41b1f846422ac8f3f\``,
    );
    await queryRunner.query(`DROP TABLE \`tier_details\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`campaigns\` DROP COLUMN \`description\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`campaigns\` DROP COLUMN \`verified\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`campaigns\` DROP COLUMN \`maxNftsPerTransaction\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tiers\` DROP COLUMN \`description\``,
    );
    await queryRunner.query(
      `CREATE TABLE \`tier_details\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`tierId\` int NOT NULL, \`info\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tier_details\` ADD CONSTRAINT \`FK_bd354b8c8e41b1f846422ac8f3f\` FOREIGN KEY (\`tierId\`) REFERENCES \`tiers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tiers\` ADD CONSTRAINT \`FK_ef795e5bc1202f220836dc62dbd\` FOREIGN KEY (\`campaignId\`) REFERENCES \`campaigns\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
