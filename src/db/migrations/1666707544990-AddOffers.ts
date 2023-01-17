import {MigrationInterface, QueryRunner} from "typeorm";

export class AddOffers1666707544990 implements MigrationInterface {
    name = 'AddOffers1666707544990'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`offers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`marketplaceOfferId\` int NOT NULL, \`priceToken\` varchar(20) NOT NULL, \`priceAmount\` varchar(62) NOT NULL, \`priceAmountDenominated\` decimal(36,18) NOT NULL DEFAULT '0.000000000000000000', \`priceNonce\` int NOT NULL, \`status\` varchar(8) NOT NULL, \`ownerAddress\` varchar(62) NOT NULL, \`identifier\` varchar(30) NOT NULL, \`collection\` varchar(20) NOT NULL, \`boughtTokensNo\` varchar(62) NULL, \`blockHash\` varchar(64) NOT NULL, \`marketplaceKey\` varchar(20) NOT NULL, INDEX \`offer_status\` (\`status\`), INDEX \`offer_owner\` (\`ownerAddress\`), INDEX \`offer_identifier\` (\`identifier\`), INDEX \`offer_collection\` (\`collection\`), INDEX \`offer_marketplace_key\` (\`marketplaceKey\`), UNIQUE INDEX \`OfferEntity_UQ_Marketplace\` (\`marketplaceOfferId\`, \`marketplaceKey\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`OfferEntity_UQ_Marketplace\` ON \`offers\``);
        await queryRunner.query(`DROP INDEX \`offer_marketplace_key\` ON \`offers\``);
        await queryRunner.query(`DROP INDEX \`offer_collection\` ON \`offers\``);
        await queryRunner.query(`DROP INDEX \`offer_identifier\` ON \`offers\``);
        await queryRunner.query(`DROP INDEX \`offer_owner\` ON \`offers\``);
        await queryRunner.query(`DROP INDEX \`offer_status\` ON \`offers\``);
        await queryRunner.query(`DROP TABLE \`offers\``);
    }

}
