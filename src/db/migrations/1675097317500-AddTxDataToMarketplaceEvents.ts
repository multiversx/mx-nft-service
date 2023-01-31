import {MigrationInterface, QueryRunner} from "typeorm";

export class AddTxDataToMarketplaceEvents1675097317500 implements MigrationInterface {
    name = 'AddTxDataToMarketplaceEvents1675097317500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`MarketplaceEventsEntity_UQ_EVENT\` ON \`marketplace_events\``);
        await queryRunner.query(`ALTER TABLE \`marketplace_events\` DROP COLUMN \`order\``);
        await queryRunner.query(`ALTER TABLE \`marketplace_events\` ADD \`eventOrder\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`marketplace_events\` ADD \`isTx\` tinyint NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`MarketplaceEventsEntity_UQ_EVENT\` ON \`marketplace_events\` (\`txHash\`, \`eventOrder\`, \`isTx\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`MarketplaceEventsEntity_UQ_EVENT\` ON \`marketplace_events\``);
        await queryRunner.query(`ALTER TABLE \`marketplace_events\` DROP COLUMN \`isTx\``);
        await queryRunner.query(`ALTER TABLE \`marketplace_events\` DROP COLUMN \`eventOrder\``);
        await queryRunner.query(`ALTER TABLE \`marketplace_events\` ADD \`order\` int NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`MarketplaceEventsEntity_UQ_EVENT\` ON \`marketplace_events\` (\`txHash\`, \`order\`)`);
    }

}
