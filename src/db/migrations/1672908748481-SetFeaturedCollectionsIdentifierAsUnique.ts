import {MigrationInterface, QueryRunner} from "typeorm";

export class SetFeaturedCollectionsIdentifierAsUnique1672908748481 implements MigrationInterface {
    name = 'SetFeaturedCollectionsIdentifierAsUnique1672908748481'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_70200621f1cff27f7717c3d707\` ON \`featured_collections\``);
        await queryRunner.query(`ALTER TABLE \`featured_collections\` ADD UNIQUE INDEX \`IDX_70200621f1cff27f7717c3d707\` (\`identifier\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`featured_collections\` DROP INDEX \`IDX_70200621f1cff27f7717c3d707\``);
        await queryRunner.query(`CREATE INDEX \`IDX_70200621f1cff27f7717c3d707\` ON \`featured_collections\` (\`identifier\`)`);
    }

}
