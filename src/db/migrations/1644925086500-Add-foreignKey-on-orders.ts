import {MigrationInterface, QueryRunner} from "typeorm";

export class AddForeignKeyOnOrders1644925086500 implements MigrationInterface {
    name = 'AddForeignKeyOnOrders1644925086500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_8f5ca3322575ad2005465ede3ca\` FOREIGN KEY (\`auctionId\`) REFERENCES \`auctions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_8f5ca3322575ad2005465ede3ca\``);
    }

}
