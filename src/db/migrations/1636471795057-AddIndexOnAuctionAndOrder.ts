import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIndexOnAuctionAndOrder1636471795057 implements MigrationInterface {
    name = 'AddIndexOnAuctionAndOrder1636471795057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `order_auction_id` ON `orders` (`auctionId`)");
        await queryRunner.query("CREATE INDEX `auction_status` ON `auctions` (`status`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `auction_status` ON `auctions`");
        await queryRunner.query("DROP INDEX `order_auction_id` ON `orders`");
    }

}
