import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExamSubmissionJobs1768300000000 implements MigrationInterface {
  name = 'CreateExamSubmissionJobs1768300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_submission_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying NOT NULL,
        "submission_id" uuid NOT NULL,
        "exam_id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "answers" jsonb NOT NULL,
        "updated_by" uuid,
        "status" character varying NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "max_attempts" integer NOT NULL DEFAULT 5,
        "available_at" TIMESTAMP NOT NULL DEFAULT now(),
        "locked_at" TIMESTAMP,
        "last_error" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_submission_jobs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exam_submission_jobs_status_available"
      ON "exam_submission_jobs" ("status", "available_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exam_submission_jobs_submission_id"
      ON "exam_submission_jobs" ("submission_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_submission_jobs_submission_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_submission_jobs_status_available"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_submission_jobs"`);
  }
}
