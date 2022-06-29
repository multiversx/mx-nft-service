import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFlags1656489314232 implements MigrationInterface {
    name = 'AddFlags1656489314232'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`nft_flags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(25) NOT NULL, \`nsfw\` decimal NOT NULL, INDEX \`IDX_37a67b537f8fe7c75e404c86e4\` (\`identifier\`), UNIQUE INDEX \`NftFlagsEntity_UQ_Flag\` (\`identifier\`, \`nsfw\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`NftFlagsEntity_UQ_Flag\` ON \`nft_flags\``);
        await queryRunner.query(`DROP INDEX \`IDX_37a67b537f8fe7c75e404c86e4\` ON \`nft_flags\``);
        await queryRunner.query(`DROP TABLE \`nft_flags\``);
    }

}
