import {MigrationInterface, QueryRunner} from "typeorm";

export class AddNrAuctionedTokenToAuction1627458075729 implements MigrationInterface {
    name = 'AddNrAuctionedTokenToAuction1627458075729'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` ADD `nrAuctionedTokens` int NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `nrAuctionedTokens`");
    }

}
