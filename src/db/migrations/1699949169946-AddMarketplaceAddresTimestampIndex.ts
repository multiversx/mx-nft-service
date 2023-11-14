import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMarketplaceAddresTimestampIndex1699949169946 implements MigrationInterface {
    name = 'AddMarketplaceAddresTimestampIndex1699949169946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`idx_marketplaceAddress_timestamp\` ON \`marketplace_events\` (\`marketplaceAddress\`, \`timestamp\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`idx_marketplaceAddress_timestamp\` ON \`marketplace_events\``);
    }

}
