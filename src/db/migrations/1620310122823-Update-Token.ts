import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateToken1620310122823 implements MigrationInterface {
    name = 'UpdateToken1620310122823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `Tokens` (`id` int NOT NULL AUTO_INCREMENT, `tokenName` varchar(25) NOT NULL, `tokenTicker` varchar(25) NOT NULL, `tokenIdentifier` varchar(100) NULL, `owner` varchar(100) NOT NULL, `creationDate` date NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE `Tokens`");
    }

}
