import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMarkeplaceSlug1660230390965 implements MigrationInterface {
    name = 'AddMarkeplaceSlug1660230390965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auctions\` ADD \`marketplaceKey\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD \`key\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD UNIQUE INDEX \`IDX_1ef126eed13fce9978858b05af\` (\`key\`)`);
        await queryRunner.query(`CREATE INDEX \`auction_marketplace_key\` ON \`auctions\` (\`marketplaceKey\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`auction_marketplace_key\` ON \`auctions\``);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP INDEX \`IDX_1ef126eed13fce9978858b05af\``);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP COLUMN \`key\``);
        await queryRunner.query(`ALTER TABLE \`auctions\` DROP COLUMN \`marketplaceKey\``);
    }

}
