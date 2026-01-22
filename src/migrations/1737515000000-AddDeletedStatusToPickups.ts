import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedStatusToPickups1737512000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE pickups_status_enum ADD VALUE IF NOT EXISTS 'deleted';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Créer un nouvel ENUM sans 'deleted'
      CREATE TYPE pickups_status_enum_old AS ENUM ('pending', 'done', 'canceled');
      
      -- Changer les colonnes pour utiliser le type text temporairement
      ALTER TABLE pickups ALTER COLUMN status TYPE text;
      
      -- Supprimer l'ancien ENUM
      DROP TYPE pickups_status_enum;
      
      -- Renommer le nouvel ENUM
      ALTER TYPE pickups_status_enum_old RENAME TO pickups_status_enum;
      
      -- Restaurer le type ENUM sur la colonne
      ALTER TABLE pickups ALTER COLUMN status TYPE pickups_status_enum USING status::pickups_status_enum;
    `);
  }
}