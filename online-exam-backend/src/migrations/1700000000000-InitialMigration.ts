import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "userid" character varying(50) NOT NULL,
        "password" character varying(255),
        "role" character varying(20) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "class_id" uuid,
        "class_name" character varying(20) NOT NULL,
        "nisn" character varying(30) NOT NULL,
        "gender" character varying(1) NOT NULL,
        "description" character varying(200) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying(100) NOT NULL,
        "updated_at" TIMESTAMP,
        "updated_by" character varying(100),
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying(100),
        CONSTRAINT "UQ_users_userid" UNIQUE ("userid"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create subjects table
    await queryRunner.query(`
      CREATE TABLE "subjects" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "description" character varying(255),
        "class_id" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying(100) NOT NULL,
        "updated_at" TIMESTAMP,
        "updated_by" character varying(100),
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying(100),
        CONSTRAINT "PK_subjects" PRIMARY KEY ("id")
      )
    `);

    // Create exams table
    await queryRunner.query(`
      CREATE TABLE "exams" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "type" character varying NOT NULL,
        "duration" integer NOT NULL,
        "notes" text,
        "subject_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying(100) NOT NULL,
        "updated_at" TIMESTAMP,
        "updated_by" character varying(100),
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying(100),
        CONSTRAINT "PK_exams" PRIMARY KEY ("id")
      )
    `);

    // Create questionnaires table
    await queryRunner.query(`
      CREATE TABLE "questionnaires" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exam_id" uuid NOT NULL,
        "question" text NOT NULL,
        "type" character varying NOT NULL,
        "options" jsonb,
        "answer" text,
        "index" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying(100) NOT NULL,
        "updated_at" TIMESTAMP,
        "updated_by" character varying(100),
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying(100),
        CONSTRAINT "PK_questionnaires" PRIMARY KEY ("id")
      )
    `);

    // Create exam_submissions table
    await queryRunner.query(`
      CREATE TABLE "exam_submissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exam_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "answers" jsonb NOT NULL,
        "score" real,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_submissions" PRIMARY KEY ("id")
      )
    `);

    // Create exam_sessions table
    await queryRunner.query(`
      CREATE TABLE "exam_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exam_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "tab_switch_count" integer NOT NULL DEFAULT 0,
        "finished" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_exam_sessions" PRIMARY KEY ("id")
      )
    `);

    // Create questions table
    await queryRunner.query(`
      CREATE TABLE "questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "exam_id" uuid NOT NULL,
        "question" text NOT NULL,
        "type" character varying NOT NULL,
        "options" jsonb,
        "answer" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying(100) NOT NULL,
        "updated_at" TIMESTAMP,
        "updated_by" character varying(100),
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying(100),
        CONSTRAINT "PK_questions" PRIMARY KEY ("id")
      )
    `);

    // Create choices table
    await queryRunner.query(`
      CREATE TABLE "choices" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "question_id" uuid NOT NULL,
        "text" text NOT NULL,
        "is_correct" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_by" character varying(100) NOT NULL,
        "updated_at" TIMESTAMP,
        "updated_by" character varying(100),
        "deleted_at" TIMESTAMP,
        "deleted_by" character varying(100),
        CONSTRAINT "PK_choices" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "exams" 
      ADD CONSTRAINT "FK_exams_subject_id" 
      FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "questionnaires" 
      ADD CONSTRAINT "FK_questionnaires_exam_id" 
      FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_submissions" 
      ADD CONSTRAINT "FK_exam_submissions_exam_id" 
      FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_submissions" 
      ADD CONSTRAINT "FK_exam_submissions_student_id" 
      FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_sessions" 
      ADD CONSTRAINT "FK_exam_sessions_exam_id" 
      FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "exam_sessions" 
      ADD CONSTRAINT "FK_exam_sessions_student_id" 
      FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "questions" 
      ADD CONSTRAINT "FK_questions_exam_id" 
      FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "choices" 
      ADD CONSTRAINT "FK_choices_question_id" 
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Create indexes for better performance
    await queryRunner.query(`CREATE INDEX "IDX_users_userid" ON "users" ("userid")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
    await queryRunner.query(`CREATE INDEX "IDX_exams_subject_id" ON "exams" ("subject_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_exam_submissions_exam_id" ON "exam_submissions" ("exam_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_exam_submissions_student_id" ON "exam_submissions" ("student_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_questionnaires_exam_id" ON "questionnaires" ("exam_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_questionnaires_exam_id"`);
    await queryRunner.query(`DROP INDEX "IDX_exam_submissions_student_id"`);
    await queryRunner.query(`DROP INDEX "IDX_exam_submissions_exam_id"`);
    await queryRunner.query(`DROP INDEX "IDX_exams_subject_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_role"`);
    await queryRunner.query(`DROP INDEX "IDX_users_userid"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "choices" DROP CONSTRAINT "FK_choices_question_id"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_questions_exam_id"`);
    await queryRunner.query(`ALTER TABLE "exam_sessions" DROP CONSTRAINT "FK_exam_sessions_student_id"`);
    await queryRunner.query(`ALTER TABLE "exam_sessions" DROP CONSTRAINT "FK_exam_sessions_exam_id"`);
    await queryRunner.query(`ALTER TABLE "exam_submissions" DROP CONSTRAINT "FK_exam_submissions_student_id"`);
    await queryRunner.query(`ALTER TABLE "exam_submissions" DROP CONSTRAINT "FK_exam_submissions_exam_id"`);
    await queryRunner.query(`ALTER TABLE "questionnaires" DROP CONSTRAINT "FK_questionnaires_exam_id"`);
    await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "FK_exams_subject_id"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "choices"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TABLE "exam_sessions"`);
    await queryRunner.query(`DROP TABLE "exam_submissions"`);
    await queryRunner.query(`DROP TABLE "questionnaires"`);
    await queryRunner.query(`DROP TABLE "exams"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
