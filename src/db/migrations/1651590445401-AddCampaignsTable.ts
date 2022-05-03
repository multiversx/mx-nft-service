import {MigrationInterface, QueryRunner} from "typeorm";

export class AddCampaignsTable1651590445401 implements MigrationInterface {
    name = 'AddCampaignsTable1651590445401'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`campaigns\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`campaignId\` varchar(20) NOT NULL, \`collectionHash\` varchar(62) NOT NULL, \`collectionName\` varchar(20) NOT NULL, \`collectionTicker\` varchar(20) NOT NULL, \`mediaType\` varchar(10) NOT NULL, \`minterAddress\` varchar(62) NOT NULL, \`mintToken\` varchar(20) NOT NULL, \`mintPrice\` varchar(255) NOT NULL, \`mintPriceDenominated\` decimal(36,18) NOT NULL DEFAULT '0.000000000000000000', \`startDate\` int NOT NULL, \`endDate\` int NOT NULL, \`totalNfts\` int NOT NULL, \`availableNfts\` int NOT NULL, \`royalties\` varchar(10) NOT NULL, INDEX \`minter_address\` (\`minterAddress\`), UNIQUE INDEX \`CampaignEntity_UQ\` (\`minterAddress\`, \`campaignId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`CampaignEntity_UQ\` ON \`campaigns\``);
        await queryRunner.query(`DROP INDEX \`minter_address\` ON \`campaigns\``);
        await queryRunner.query(`DROP TABLE \`campaigns\``);
    }

}
