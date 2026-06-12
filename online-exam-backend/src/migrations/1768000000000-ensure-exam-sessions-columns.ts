import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureExamSessionsColumns1768000000000 implements MigrationInterface {
  name = 'EnsureExamSessionsColumns1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_sessions"
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now(),
        ADD COLUMN IF NOT EXISTS "tab_switch_count" integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "finished" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "status" character varying NOT NULL DEFAULT 'started',
        ADD COLUMN IF NOT EXISTS "finished_reason" character varying,
        ADD COLUMN IF NOT EXISTS "finished_at" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_sessions"
        DROP COLUMN IF EXISTS "finished_at",
        DROP COLUMN IF EXISTS "finished_reason",
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "updated_at",
        DROP COLUMN IF EXISTS "created_at"
    `);
  }
}
