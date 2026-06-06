import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueExamSubmissionPerStudent1768200000000 implements MigrationInterface {
  name = 'AddUniqueExamSubmissionPerStudent1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        duplicate_count integer;
      BEGIN
        SELECT COUNT(*)
        INTO duplicate_count
        FROM (
          SELECT exam_id, student_id
          FROM exam_submissions
          GROUP BY exam_id, student_id
          HAVING COUNT(*) > 1
        ) duplicates;

        IF duplicate_count > 0 THEN
          RAISE EXCEPTION 'Cannot add unique constraint: % duplicate exam submission pair(s) found for exam_id + student_id', duplicate_count;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_submissions"
      ADD CONSTRAINT "UQ_exam_submissions_exam_student"
      UNIQUE ("exam_id", "student_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_submissions"
      DROP CONSTRAINT IF EXISTS "UQ_exam_submissions_exam_student"
    `);
  }
}
