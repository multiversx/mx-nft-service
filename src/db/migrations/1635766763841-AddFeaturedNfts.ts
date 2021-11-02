import {MigrationInterface, QueryRunner} from "typeorm";

export class AddFeaturedNfts1635766763841 implements MigrationInterface {
    name = 'AddFeaturedNfts1635766763841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `featured_nfts` (`id` int NOT NULL AUTO_INCREMENT, `identifier` varchar(25) NOT NULL, INDEX `IDX_e18b70f57ae7ca3c2ac8774aa6` (`identifier`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_e18b70f57ae7ca3c2ac8774aa6` ON `featured_nfts`");
        await queryRunner.query("DROP TABLE `featured_nfts`");
    }

}
