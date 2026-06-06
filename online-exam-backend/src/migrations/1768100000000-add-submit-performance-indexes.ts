import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubmitPerformanceIndexes1768100000000 implements MigrationInterface {
  name = 'AddSubmitPerformanceIndexes1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exam_submissions_exam_student"
      ON "exam_submissions" ("exam_id", "student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exam_submissions_session_id"
      ON "exam_submissions" ("session_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_questionnaires_exam_active"
      ON "questionnaires" ("exam_id", "deleted_at")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_exam_sessions_id_finished"
      ON "exam_sessions" ("id", "finished")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_sessions_id_finished"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_questionnaires_exam_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_submissions_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_exam_submissions_exam_student"`);
  }
}
