import {MigrationInterface, QueryRunner} from "typeorm";

export class AddNotificationsTable1657270731481 implements MigrationInterface {
    name = 'AddNotificationsTable1657270731481'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`ownerAddress\` varchar(62) NOT NULL, \`status\` varchar(8) NOT NULL, \`type\` varchar(15) NOT NULL, \`identifier\` varchar(62) NULL, \`auctionId\` int NOT NULL, INDEX \`notification_owner\` (\`ownerAddress\`), INDEX \`notification_status\` (\`status\`), INDEX \`auction_id\` (\`auctionId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`auction_id\` ON \`notifications\``);
        await queryRunner.query(`DROP INDEX \`notification_status\` ON \`notifications\``);
        await queryRunner.query(`DROP INDEX \`notification_owner\` ON \`notifications\``);
        await queryRunner.query(`DROP TABLE \`notifications\``);
    }

}
