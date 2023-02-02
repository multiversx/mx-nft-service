import {MigrationInterface, QueryRunner} from "typeorm";

export class AddReportCollectionEntity1675344630756 implements MigrationInterface {
    name = 'AddReportCollectionEntity1675344630756'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`report_collections\` (\`id\` int NOT NULL AUTO_INCREMENT, \`collectionIdentifier\` varchar(25) NOT NULL, \`address\` varchar(62) NOT NULL, INDEX \`IDX_15e88facdcba257a5cc4f5ce2d\` (\`collectionIdentifier\`), UNIQUE INDEX \`ReportCollectionEntity_UQ_REPORT\` (\`collectionIdentifier\`, \`address\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`ReportCollectionEntity_UQ_REPORT\` ON \`report_collections\``);
        await queryRunner.query(`DROP INDEX \`IDX_15e88facdcba257a5cc4f5ce2d\` ON \`report_collections\``);
        await queryRunner.query(`DROP TABLE \`report_collections\``);
    }

}
