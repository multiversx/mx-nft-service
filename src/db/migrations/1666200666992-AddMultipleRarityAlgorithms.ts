import {MigrationInterface, QueryRunner} from "typeorm";

export class AddMultipleRarityAlgorithms1666200666992 implements MigrationInterface {
    name = 'AddMultipleRarityAlgorithms1666200666992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score_openRarity\` decimal(10,3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank_openRarity\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score_jaccardDistances\` decimal(6,3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank_jaccardDistances\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score_trait\` decimal(10,3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank_trait\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score_statistical\` decimal(19,18) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank_statistical\` int NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank_statistical\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score_statistical\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank_trait\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score_trait\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank_jaccardDistances\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score_jaccardDistances\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank_openRarity\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score_openRarity\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score\` decimal(6,3) NOT NULL`);
    }

}
