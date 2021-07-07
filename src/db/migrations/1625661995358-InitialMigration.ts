import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialMigration1625661995358 implements MigrationInterface {
    name = 'InitialMigration1625661995358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `assets_likes` (`id` int NOT NULL AUTO_INCREMENT, `creationDate` datetime NOT NULL, `modifiedDate` datetime NULL, `identifier` varchar(25) NOT NULL, `address` varchar(62) NOT NULL, INDEX `IDX_729a168916192c1f80bbe07ec5` (`identifier`), UNIQUE INDEX `AssetLikeEntity_UQ_LIKE` (`identifier`, `address`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `orders` (`id` int NOT NULL AUTO_INCREMENT, `creationDate` datetime NOT NULL, `modifiedDate` datetime NULL, `priceToken` varchar(255) NOT NULL, `priceAmount` varchar(255) NOT NULL, `priceNonce` int NOT NULL, `status` varchar(255) NOT NULL, `ownerAddress` varchar(62) NOT NULL, `auctionId` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `auctions` (`id` int NOT NULL AUTO_INCREMENT, `creationDate` datetime NOT NULL, `modifiedDate` datetime NULL, `collection` varchar(20) NOT NULL, `identifier` varchar(30) NOT NULL, `nonce` int NOT NULL, `status` varchar(255) NOT NULL, `type` varchar(255) NOT NULL, `paymentToken` varchar(20) NOT NULL, `paymentNonce` int NOT NULL, `ownerAddress` varchar(62) NOT NULL, `minBid` varchar(255) NOT NULL, `maxBid` varchar(255) NOT NULL, `startDate` varchar(255) NOT NULL, `endDate` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `followers` (`id` int NOT NULL AUTO_INCREMENT, `creationDate` datetime NOT NULL, `modifiedDate` datetime NULL, `followerAddress` varchar(62) NOT NULL, `followingAddress` varchar(62) NOT NULL, UNIQUE INDEX `FollowEntity_UQ_Follow` (`followerAddress`, `followingAddress`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `FollowEntity_UQ_Follow` ON `followers`");
        await queryRunner.query("DROP TABLE `followers`");
        await queryRunner.query("DROP TABLE `auctions`");
        await queryRunner.query("DROP TABLE `orders`");
        await queryRunner.query("DROP INDEX `AssetLikeEntity_UQ_LIKE` ON `assets_likes`");
        await queryRunner.query("DROP INDEX `IDX_729a168916192c1f80bbe07ec5` ON `assets_likes`");
        await queryRunner.query("DROP TABLE `assets_likes`");
    }

}
