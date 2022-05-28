import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIndexForOnwerAddress1643206683172 implements MigrationInterface {
    name = 'AddIndexForOnwerAddress1643206683172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `order_owner` ON `orders` (`ownerAddress`)");
        await queryRunner.query("CREATE INDEX `auction_owner` ON `auctions` (`ownerAddress`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `auction_owner` ON `auctions`");
        await queryRunner.query("DROP INDEX `order_owner` ON `orders`");
    }

}
