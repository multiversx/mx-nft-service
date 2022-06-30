import {MigrationInterface, QueryRunner} from "typeorm";

export class AddNftFlags1656575464518 implements MigrationInterface {
    name = 'AddNftFlags1656575464518'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`nft_flags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(25) NOT NULL, \`nsfw\` decimal(6,2) NOT NULL, INDEX \`IDX_37a67b537f8fe7c75e404c86e4\` (\`identifier\`), UNIQUE INDEX \`NftFlagsEntity_UQ_Flag\` (\`identifier\`, \`nsfw\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`NftFlagsEntity_UQ_Flag\` ON \`nft_flags\``);
        await queryRunner.query(`DROP INDEX \`IDX_37a67b537f8fe7c75e404c86e4\` ON \`nft_flags\``);
        await queryRunner.query(`DROP TABLE \`nft_flags\``);
    }

}
