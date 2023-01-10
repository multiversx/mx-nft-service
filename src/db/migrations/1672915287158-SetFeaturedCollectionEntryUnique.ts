import {MigrationInterface, QueryRunner} from "typeorm";

export class SetFeaturedCollectionEntryUnique1672915287158 implements MigrationInterface {
    name = 'SetFeaturedCollectionEntryUnique1672915287158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX \`FeaturedCollections_UQ_Entry\` ON \`featured_collections\` (\`identifier\`, \`type\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`FeaturedCollections_UQ_Entry\` ON \`featured_collections\``);
    }
}
