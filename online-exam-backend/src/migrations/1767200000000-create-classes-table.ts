import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateClassesTable1767200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable('classes');
    if (exists) return;

    await queryRunner.createTable(
      new Table({
        name: 'classes',
        columns: [
          { name: 'id', type: 'varchar', length: '100', isPrimary: true },
          { name: 'name', type: 'varchar', length: '100' },
          { name: 'grade', type: 'int', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'updated_at', type: 'timestamptz', isNullable: true },
          { name: 'updated_by', type: 'uuid', isNullable: true },
          { name: 'deleted_at', type: 'timestamptz', isNullable: true },
          { name: 'deleted_by', type: 'uuid', isNullable: true },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('classes', true);
  }
}
