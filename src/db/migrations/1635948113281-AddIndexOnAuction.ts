import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIndexOnAuction1635948113281 implements MigrationInterface {
    name = 'AddIndexOnAuction1635948113281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `IDX_479b0e4e47a1702887a1ffdff5` ON `auctions` (`identifier`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_479b0e4e47a1702887a1ffdff5` ON `auctions`");
    }

}
