import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamSubmissionRecordingFiles1768400000000 implements MigrationInterface {
  name = 'AddExamSubmissionRecordingFiles1768400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_submissions"
      ADD COLUMN IF NOT EXISTS "recording_files" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_submissions"
      DROP COLUMN IF EXISTS "recording_files"
    `);
  }
}
