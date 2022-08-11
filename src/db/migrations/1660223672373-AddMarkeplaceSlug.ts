import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMarkeplaceSlug1660223672373 implements MigrationInterface {
    name = 'AddMarkeplaceSlug1660223672373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`auctions\` ADD \`marketplaceKey\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD \`key\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` ADD UNIQUE INDEX \`IDX_1ef126eed13fce9978858b05af\` (\`key\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP INDEX \`IDX_1ef126eed13fce9978858b05af\``);
        await queryRunner.query(`ALTER TABLE \`marketplaces\` DROP COLUMN \`key\``);
        await queryRunner.query(`ALTER TABLE \`auctions\` DROP COLUMN \`marketplaceKey\``);
    }

}
