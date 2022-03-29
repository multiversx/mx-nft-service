import {MigrationInterface, QueryRunner} from "typeorm";

export class AddReportEntity1648548692750 implements MigrationInterface {
    name = 'AddReportEntity1648548692750'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`report_nfts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(25) NOT NULL, \`address\` varchar(62) NOT NULL, INDEX \`IDX_22d52a1ff52468314f1a088c1d\` (\`identifier\`), UNIQUE INDEX \`ReportNftEntity_UQ_REPORT\` (\`identifier\`, \`address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`ReportNftEntity_UQ_REPORT\` ON \`report_nfts\``);
        await queryRunner.query(`DROP INDEX \`IDX_22d52a1ff52468314f1a088c1d\` ON \`report_nfts\``);
        await queryRunner.query(`DROP TABLE \`report_nfts\``);
    }

}
