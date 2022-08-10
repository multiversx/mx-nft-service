import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSubdomains1660120726685 implements MigrationInterface {
    name = 'AddSubdomains1660120726685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`subdomains\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`name\` varchar(50) NOT NULL, \`url\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`subdomain-collections\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDate\` datetime NOT NULL, \`modifiedDate\` datetime NULL, \`collectionIdentifier\` varchar(20) NOT NULL, \`collectionName\` varchar(20) NOT NULL, \`subdomainId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`subdomain-collections\` ADD CONSTRAINT \`FK_244fddbba0468810ad4f7df7d7f\` FOREIGN KEY (\`subdomainId\`) REFERENCES \`subdomains\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`subdomain-collections\` DROP FOREIGN KEY \`FK_244fddbba0468810ad4f7df7d7f\``);
        await queryRunner.query(`DROP TABLE \`subdomain-collections\``);
        await queryRunner.query(`DROP TABLE \`subdomains\``);
    }

}
