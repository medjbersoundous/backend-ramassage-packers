import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpoPushTokensToCollector1759508460222 implements MigrationInterface {
    name = 'AddExpoPushTokensToCollector1759508460222'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collector" RENAME COLUMN "expoPushToken" TO "expoPushTokens"`);
        await queryRunner.query(`ALTER TABLE "collector" DROP COLUMN "expoPushTokens"`);
        await queryRunner.query(`ALTER TABLE "collector" ADD "expoPushTokens" jsonb DEFAULT '[]'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collector" DROP COLUMN "expoPushTokens"`);
        await queryRunner.query(`ALTER TABLE "collector" ADD "expoPushTokens" character varying`);
        await queryRunner.query(`ALTER TABLE "collector" RENAME COLUMN "expoPushTokens" TO "expoPushToken"`);
    }

}
