import {MigrationInterface, QueryRunner} from 'typeorm';

export class ChangedTokenNonceAndIdentifierNaming1623066580549 implements MigrationInterface {
    name = 'ChangedTokenNonceAndIdentifierNaming1623066580549';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_9d1f8e9fc0339c4216c3e3e087` ON `assets_likes`");
        await queryRunner.query("DROP INDEX `IDX_d06ad49544e7ffe79936e13fb7` ON `assets_likes`");
        await queryRunner.query("ALTER TABLE `assets_likes` DROP COLUMN `token_identifier`");
        await queryRunner.query("ALTER TABLE `assets_likes` DROP COLUMN `token_nonce`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `token_identifier`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `token_nonce`");
        await queryRunner.query("ALTER TABLE `assets_likes` ADD `token` varchar(25) NOT NULL");
        await queryRunner.query("ALTER TABLE `assets_likes` ADD `nonce` int NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `token` varchar(20) NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `nonce` int NOT NULL");
        await queryRunner.query("CREATE INDEX `IDX_d98f75d1f8e4a9ae61c09e740a` ON `assets_likes` (`token`)");
        await queryRunner.query("CREATE INDEX `IDX_1e82fe7e0adcc42102b307099e` ON `assets_likes` (`nonce`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_1e82fe7e0adcc42102b307099e` ON `assets_likes`");
        await queryRunner.query("DROP INDEX `IDX_d98f75d1f8e4a9ae61c09e740a` ON `assets_likes`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `nonce`");
        await queryRunner.query("ALTER TABLE `auctions` DROP COLUMN `token`");
        await queryRunner.query("ALTER TABLE `assets_likes` DROP COLUMN `nonce`");
        await queryRunner.query("ALTER TABLE `assets_likes` DROP COLUMN `token`");
        await queryRunner.query("ALTER TABLE `auctions` ADD `token_nonce` int NOT NULL");
        await queryRunner.query("ALTER TABLE `auctions` ADD `token_identifier` varchar(20) NOT NULL");
        await queryRunner.query("ALTER TABLE `assets_likes` ADD `token_nonce` int NOT NULL");
        await queryRunner.query("ALTER TABLE `assets_likes` ADD `token_identifier` varchar(25) NOT NULL");
        await queryRunner.query("CREATE INDEX `IDX_d06ad49544e7ffe79936e13fb7` ON `assets_likes` (`token_nonce`)");
        await queryRunner.query("CREATE INDEX `IDX_9d1f8e9fc0339c4216c3e3e087` ON `assets_likes` (`token_identifier`)");
    }

}
