import {MigrationInterface, QueryRunner} from "typeorm";

export class AddBlacklistedCollections1674130203485 implements MigrationInterface {
    name = 'AddBlacklistedCollections1674130203485'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`blacklisted_collections\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(25) NOT NULL, INDEX \`IDX_0073176ad04a85f121aa5b87ac\` (\`identifier\`), UNIQUE INDEX \`BlacklistedCollections_UQ_Entry\` (\`identifier\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`BlacklistedCollections_UQ_Entry\` ON \`blacklisted_collections\``);
        await queryRunner.query(`DROP INDEX \`IDX_0073176ad04a85f121aa5b87ac\` ON \`blacklisted_collections\``);
        await queryRunner.query(`DROP TABLE \`blacklisted_collections\``);
    }

}
