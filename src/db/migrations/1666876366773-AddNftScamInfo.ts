import {MigrationInterface, QueryRunner} from "typeorm";

export class AddNftScamInfo1666876366773 implements MigrationInterface {
    name = 'AddNftScamInfo1666876366773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`nft_scams\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(30) NOT NULL, \`version\` varchar(20) NOT NULL, \`type\` varchar(20) NULL, \`info\` varchar(50) NULL, INDEX \`IDX_1ee767351fa0013a4ee1c665ab\` (\`identifier\`), UNIQUE INDEX \`NftScamEntity_UQ_SCAM\` (\`identifier\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`NftScamEntity_UQ_SCAM\` ON \`nft_scams\``);
        await queryRunner.query(`DROP INDEX \`IDX_1ee767351fa0013a4ee1c665ab\` ON \`nft_scams\``);
        await queryRunner.query(`DROP TABLE \`nft_scams\``);
    }

}
