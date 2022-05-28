import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCampaigns1651656714392 implements MigrationInterface {
    name = 'AddCampaigns1651656714392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tier_details\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`tierId\` int NOT NULL, \`info\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tiers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`campaignId\` int NOT NULL, \`tierName\` varchar(20) NOT NULL, \`mintPrice\` varchar(255) NOT NULL, \`mintPriceDenominated\` decimal(36,18) NOT NULL DEFAULT '0.000000000000000000', \`totalNfts\` int NOT NULL, \`availableNfts\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`campaigns\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`campaignId\` varchar(20) NOT NULL, \`collectionHash\` varchar(62) NOT NULL, \`collectionName\` varchar(20) NOT NULL, \`collectionTicker\` varchar(20) NOT NULL, \`mediaType\` varchar(10) NOT NULL, \`minterAddress\` varchar(62) NOT NULL, \`mintToken\` varchar(20) NOT NULL, \`startDate\` int NOT NULL, \`endDate\` int NOT NULL, \`totalNfts\` int NOT NULL, \`availableNfts\` int NOT NULL, \`royalties\` varchar(10) NOT NULL, INDEX \`minter_address\` (\`minterAddress\`), UNIQUE INDEX \`CampaignEntity_UQ\` (\`minterAddress\`, \`campaignId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tier_details\` ADD CONSTRAINT \`FK_bd354b8c8e41b1f846422ac8f3f\` FOREIGN KEY (\`tierId\`) REFERENCES \`tiers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tiers\` ADD CONSTRAINT \`FK_ef795e5bc1202f220836dc62dbd\` FOREIGN KEY (\`campaignId\`) REFERENCES \`campaigns\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tiers\` DROP FOREIGN KEY \`FK_ef795e5bc1202f220836dc62dbd\``);
        await queryRunner.query(`ALTER TABLE \`tier_details\` DROP FOREIGN KEY \`FK_bd354b8c8e41b1f846422ac8f3f\``);
        await queryRunner.query(`DROP INDEX \`CampaignEntity_UQ\` ON \`campaigns\``);
        await queryRunner.query(`DROP INDEX \`minter_address\` ON \`campaigns\``);
        await queryRunner.query(`DROP TABLE \`campaigns\``);
        await queryRunner.query(`DROP TABLE \`tiers\``);
        await queryRunner.query(`DROP TABLE \`tier_details\``);
    }

}
