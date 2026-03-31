import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateExamStudents1711023456789 implements MigrationInterface {
  name = 'CreateExamStudents1711023456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "exam_students" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exam_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" uuid,
        "deleted_at" TIMESTAMP,
        "deleted_by" uuid,
        CONSTRAINT "PK_exam_students" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_students"
      ADD CONSTRAINT "FK_exam_students_exam"
      FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_students"
      ADD CONSTRAINT "FK_exam_students_student"
      FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "exam_students"`);
  }
}
