import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUsersCreatedByDefault1764000000000 implements MigrationInterface {
  name = 'FixUsersCreatedByDefault1764000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_users_created_by_default()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.id IS NULL THEN
          NEW.id := gen_random_uuid();
        END IF;

        IF NEW.created_by IS NULL THEN
          NEW.created_by := NEW.id;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_set_users_created_by_default ON users;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_set_users_created_by_default
      BEFORE INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_users_created_by_default();
    `);

    await queryRunner.query(`
      UPDATE users
      SET created_by = id
      WHERE created_by IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_set_users_created_by_default ON users;
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS set_users_created_by_default();
    `);
  }
}
