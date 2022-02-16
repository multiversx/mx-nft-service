import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFeaturedCollection1644936758636 implements MigrationInterface {
    name = 'AddFeaturedCollection1644936758636'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`featured_collections\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(25) NOT NULL, INDEX \`IDX_70200621f1cff27f7717c3d707\` (\`identifier\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_70200621f1cff27f7717c3d707\` ON \`featured_collections\``);
        await queryRunner.query(`DROP TABLE \`featured_collections\``);
    }

}
