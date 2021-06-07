import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedAssetsLikesTable1622667775007 implements MigrationInterface {
    name = 'AddedAssetsLikesTable1622667775007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `assets_likes` (`id` int NOT NULL AUTO_INCREMENT, `token_identifier` varchar(25) NOT NULL, `token_nonce` int NOT NULL, `address` varchar(62) NOT NULL, INDEX `IDX_9d1f8e9fc0339c4216c3e3e087` (`token_identifier`), INDEX `IDX_d06ad49544e7ffe79936e13fb7` (`token_nonce`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_d06ad49544e7ffe79936e13fb7` ON `assets_likes`");
        await queryRunner.query("DROP INDEX `IDX_9d1f8e9fc0339c4216c3e3e087` ON `assets_likes`");
        await queryRunner.query("DROP TABLE `assets_likes`");
    }

}
