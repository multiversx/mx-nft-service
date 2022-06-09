import {MigrationInterface, QueryRunner} from "typeorm";

export class AddTagsEntity1654760511622 implements MigrationInterface {
    name = 'AddTagsEntity1654760511622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`auctionId\` int NOT NULL, \`tag\` varchar(20) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tags\` ADD CONSTRAINT \`FK_1b807a58bb817ccee8fc241b743\` FOREIGN KEY (\`auctionId\`) REFERENCES \`auctions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tags\` DROP FOREIGN KEY \`FK_1b807a58bb817ccee8fc241b743\``);
        await queryRunner.query(`DROP TABLE \`tags\``);
    }

}
