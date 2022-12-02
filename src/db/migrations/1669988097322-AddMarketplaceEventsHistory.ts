import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMarketplaceEventsHistory1669988097322 implements MigrationInterface {
    name = 'AddMarketplaceEventsHistory1669988097322'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`marketplace_events\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`tx_hash\` varchar(64) NOT NULL, \`order\` int NOT NULL, \`original_tx_hash\` varchar(64) NULL, \`marketplace_key\` varchar(20) NOT NULL, \`timestamp\` int NOT NULL, \`data\` json NOT NULL, INDEX \`marketplace_key\` (\`marketplace_key\`), UNIQUE INDEX \`MarketplaceEventsEntity_UQ_EVENT\` (\`tx_hash\`, \`order\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD \`latest_index_timestamp\` int NULL`);
        await queryRunner.query(`CREATE INDEX \`orders_price_token\` ON \`orders\` (\`priceToken\`)`);
        await queryRunner.query(`CREATE INDEX \`orders_price_amount_denominated\` ON \`orders\` (\`priceAmountDenominated\`)`);
        await queryRunner.query(`CREATE INDEX \`auction_collection\` ON \`auctions\` (\`collection\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`auction_collection\` ON \`auctions\``);
        await queryRunner.query(`DROP INDEX \`orders_price_amount_denominated\` ON \`orders\``);
        await queryRunner.query(`DROP INDEX \`orders_price_token\` ON \`orders\``);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP COLUMN \`latest_index_timestamp\``);
        await queryRunner.query(`DROP INDEX \`MarketplaceEventsEntity_UQ_EVENT\` ON \`marketplace_events\``);
        await queryRunner.query(`DROP INDEX \`marketplace_key\` ON \`marketplace_events\``);
        await queryRunner.query(`DROP TABLE \`marketplace_events\``);
    }

}
