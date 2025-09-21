import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToAdmins1758483160682 implements MigrationInterface {
    name = 'AddRoleToAdmins1758483160682'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admins" ADD "role" character varying NOT NULL DEFAULT 'ADMIN'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admins" DROP COLUMN "role"`);
    }

}
