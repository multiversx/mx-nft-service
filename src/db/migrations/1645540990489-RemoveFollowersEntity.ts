import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFollowersEntity1645540990489 implements MigrationInterface {
  name = 'RemoveFollowersEntity1645540990489';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX `FollowEntity_UQ_Follow` ON `followers`',
    );
    await queryRunner.query('DROP TABLE `followers`');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `followers` (`id` int NOT NULL AUTO_INCREMENT, `creationDate` datetime NOT NULL, `modifiedDate` datetime NULL, `followerAddress` varchar(62) NOT NULL, `followingAddress` varchar(62) NOT NULL, UNIQUE INDEX `FollowEntity_UQ_Follow` (`followerAddress`, `followingAddress`), PRIMARY KEY (`id`)) ENGINE=InnoDB',
    );
  }
}
