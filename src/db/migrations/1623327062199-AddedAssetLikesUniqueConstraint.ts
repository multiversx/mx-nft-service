import {MigrationInterface, QueryRunner} from "typeorm";

export class AddedAssetLikesUniqueConstraint1623327062199 implements MigrationInterface {
    name = 'AddedAssetLikesUniqueConstraint1623327062199'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE UNIQUE INDEX `AssetLikeEntity_UQ_LIKE` ON `assets_likes` (`token`, `nonce`, `address`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `AssetLikeEntity_UQ_LIKE` ON `assets_likes`");
    }

}
