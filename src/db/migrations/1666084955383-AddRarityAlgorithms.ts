import {MigrationInterface, QueryRunner} from "typeorm";

export class AddRarityAlgorithms1666084955383 implements MigrationInterface {
    name = 'AddRarityAlgorithms1666084955383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score_openRarity\` decimal(6,3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank_openRarity\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score_jaccardDistances\` decimal(6,3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank_jaccardDistances\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score_trait\` decimal(6,3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank_trait\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score_statistical\` decimal(6,3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank_statistical\` int NOT NULL`);
        await queryRunner.query(`CREATE INDEX \`orders_price_token\` ON \`orders\` (\`priceToken\`)`);
        await queryRunner.query(`CREATE INDEX \`orders_price_amount_denominated\` ON \`orders\` (\`priceAmountDenominated\`)`);
        await queryRunner.query(`CREATE INDEX \`auction_collection\` ON \`auctions\` (\`collection\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`auction_collection\` ON \`auctions\``);
        await queryRunner.query(`DROP INDEX \`orders_price_amount_denominated\` ON \`orders\``);
        await queryRunner.query(`DROP INDEX \`orders_price_token\` ON \`orders\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank_statistical\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score_statistical\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank_trait\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score_trait\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank_jaccardDistances\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score_jaccardDistances\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`rank_openRarity\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` DROP COLUMN \`score_openRarity\``);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`score\` decimal(6,3) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`nft_rarities\` ADD \`rank\` int NOT NULL`);
    }

}
