import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamScoreWeights1768100000000 implements MigrationInterface {
  name = 'AddExamScoreWeights1768100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exams"
        ADD COLUMN IF NOT EXISTS "multiple_choice_weight" integer NOT NULL DEFAULT 50,
        ADD COLUMN IF NOT EXISTS "essay_weight" integer NOT NULL DEFAULT 50
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exams"
        DROP COLUMN IF EXISTS "essay_weight",
        DROP COLUMN IF EXISTS "multiple_choice_weight"
    `);
  }
}
