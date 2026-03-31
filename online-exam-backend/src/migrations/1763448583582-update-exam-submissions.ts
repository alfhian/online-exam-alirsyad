import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class UpdateExamSubmissions1711030000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // updated_at (timestamp, nullable, default CURRENT_TIMESTAMP)
    await queryRunner.addColumn(
      "exam_submissions",
      new TableColumn({
        name: "updated_at",
        type: "timestamp",
        isNullable: true,
        default: null,
      }),
    );

    // created_by
    await queryRunner.addColumn(
      "exam_submissions",
      new TableColumn({
        name: "created_by",
        type: "uuid",
        isNullable: true,
      }),
    );

    // updated_by
    await queryRunner.addColumn(
      "exam_submissions",
      new TableColumn({
        name: "updated_by",
        type: "uuid",
        isNullable: true,
      }),
    );

    // file_name
    await queryRunner.addColumn(
      "exam_submissions",
      new TableColumn({
        name: "file_name",
        type: "varchar",
        isNullable: true,
      }),
    );

    // file_path
    await queryRunner.addColumn(
      "exam_submissions",
      new TableColumn({
        name: "file_path",
        type: "varchar",
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("exam_submissions", "file_path");
    await queryRunner.dropColumn("exam_submissions", "file_name");
    await queryRunner.dropColumn("exam_submissions", "updated_by");
    await queryRunner.dropColumn("exam_submissions", "created_by");
    await queryRunner.dropColumn("exam_submissions", "updated_at");
  }
}
