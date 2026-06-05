import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureExamSessionsColumns1768000000000 implements MigrationInterface {
  name = 'EnsureExamSessionsColumns1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_sessions"
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "tab_switch_count" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "finished" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_sessions"
        DROP COLUMN IF EXISTS "updated_at",
        DROP COLUMN IF EXISTS "created_at"
    `);
  }
}
