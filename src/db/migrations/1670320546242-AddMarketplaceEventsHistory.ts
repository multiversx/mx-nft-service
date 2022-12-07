import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMarketplaceEventsHistory1670320546242 implements MigrationInterface {
    name = 'AddMarketplaceEventsHistory1670320546242'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`marketplace_events\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`txHash\` varchar(64) NOT NULL, \`order\` int NOT NULL, \`originalTxHash\` varchar(64) NULL, \`marketplaceAddress\` varchar(62) NOT NULL, \`timestamp\` int NOT NULL, \`data\` json NOT NULL, INDEX \`marketplace_address\` (\`marketplaceAddress\`), UNIQUE INDEX \`MarketplaceEventsEntity_UQ_EVENT\` (\`txHash\`, \`order\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD \`lastIndexTimestamp\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP COLUMN \`lastIndexTimestamp\``);
        await queryRunner.query(`DROP INDEX \`MarketplaceEventsEntity_UQ_EVENT\` ON \`marketplace_events\``);
        await queryRunner.query(`DROP INDEX \`marketplace_address\` ON \`marketplace_events\``);
        await queryRunner.query(`DROP TABLE \`marketplace_events\``);
    }

}
