import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureSubjectsTeacherRelationship1764651000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subjects"
        ADD COLUMN IF NOT EXISTS "teacher_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "subjects"
        DROP CONSTRAINT IF EXISTS "FK_subjects_teacher_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "subjects"
        ADD CONSTRAINT "FK_subjects_teacher_id"
        FOREIGN KEY ("teacher_id")
        REFERENCES "users"("id")
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subjects"
        DROP CONSTRAINT IF EXISTS "FK_subjects_teacher_id"
    `);
  }
}
