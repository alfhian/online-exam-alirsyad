import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureExamSubmissionUploadColumns1764650000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_submissions"
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP,
        ADD COLUMN IF NOT EXISTS "created_by" uuid,
        ADD COLUMN IF NOT EXISTS "updated_by" uuid,
        ADD COLUMN IF NOT EXISTS "file_name" varchar,
        ADD COLUMN IF NOT EXISTS "file_path" varchar,
        ADD COLUMN IF NOT EXISTS "file_url" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_submissions"
        DROP COLUMN IF EXISTS "file_url"
    `);
  }
}
