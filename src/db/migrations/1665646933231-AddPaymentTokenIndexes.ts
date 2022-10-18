import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPaymentTokenIndexes1665646933231 implements MigrationInterface {
    name = 'AddPaymentTokenIndexes1665646933231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`FK_ef795e5bc1202f220836dc62dbd\` ON \`tiers\``);
        await queryRunner.query(`DROP INDEX \`NftFlagsEntity_UQ_Flag\` ON \`nft_flags\``);
        await queryRunner.query(`CREATE INDEX \`orders_price_token_amount_denominated\` ON \`orders\` (\`priceAmount\`, \`priceAmountDenominated\`)`);
        await queryRunner.query(`CREATE INDEX \`auction_payment_token\` ON \`auctions\` (\`paymentToken\`)`);
        await queryRunner.query(`CREATE INDEX \`auction_start_date\` ON \`auctions\` (\`startDate\`)`);
        await queryRunner.query(`CREATE INDEX \`auction_end_date\` ON \`auctions\` (\`endDate\`)`);
        await queryRunner.query(`ALTER TABLE \`tiers\` ADD CONSTRAINT \`FK_ef795e5bc1202f220836dc62dbd\` FOREIGN KEY (\`campaignId\`) REFERENCES \`campaigns\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tiers\` DROP FOREIGN KEY \`FK_ef795e5bc1202f220836dc62dbd\``);
        await queryRunner.query(`DROP INDEX \`auction_end_date\` ON \`auctions\``);
        await queryRunner.query(`DROP INDEX \`auction_start_date\` ON \`auctions\``);
        await queryRunner.query(`DROP INDEX \`auction_payment_token\` ON \`auctions\``);
        await queryRunner.query(`DROP INDEX \`orders_price_token_amount_denominated\` ON \`orders\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`NftFlagsEntity_UQ_Flag\` ON \`nft_flags\` (\`identifier\`, \`nsfw\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_ef795e5bc1202f220836dc62dbd\` ON \`tiers\` (\`campaignId\`)`);
    }

}
