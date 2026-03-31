# SMK Al Irsyad Backend - PostgreSQL Setup

## Database Configuration

The application is configured to use PostgreSQL with the following default credentials:

- **Host**: localhost
- **Port**: 5432
- **Username**: postgres
- **Password**: 123
- **Database**: al_irsyad_exam

## Environment Setup

Create a `.env` file in the project root with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=123
DB_NAME=al_irsyad_exam

# Application Configuration
NODE_ENV=development
PORT=3000
ENABLE_TYPEORM=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## Database Setup Steps

1. **Install PostgreSQL** (if not already installed)
2. **Create the database**:
   ```sql
   CREATE DATABASE al_irsyad_exam;
   ```
3. **Verify PostgreSQL is running** on port 5432
4. **Create the `.env` file** with the credentials above
5. **Run the application**:
   ```bash
   npm run start:dev
   ```

## Database Features

- **Auto-synchronization**: In development mode, TypeORM will automatically create tables based on your entities
- **Logging**: SQL queries are logged in development mode
- **SSL**: Disabled for local development, enabled for production

## Troubleshooting

If you encounter connection issues:

1. Verify PostgreSQL is running: `pg_ctl status`
2. Check if the database exists: `psql -U postgres -l`
3. Test connection: `psql -U postgres -d al_irsyad_exam`
4. Ensure the password is correct (123)

### Khusus deployment VPS (error `502 Bad Gateway`)

Jika backend Anda memakai Supabase untuk query utama, biarkan `ENABLE_TYPEORM=false` agar NestJS tidak melakukan inisialisasi metadata TypeORM saat boot. Ini mencegah error startup (contoh: metadata entity tidak lengkap) yang akhirnya membuat endpoint API mengembalikan `502` dari Nginx karena upstream Node.js mati.

Gunakan:

```env
ENABLE_TYPEORM=false
```

Lalu restart service backend (PM2/systemd/docker) dan cek health endpoint API.

Jika masih muncul error:
`null value in column "created_by" of relation "users" violates not-null constraint`,
pastikan trigger default untuk tabel `users` sudah ada (migration terbaru). Untuk Supabase SQL editor, Anda bisa jalankan:

```sql
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

DROP TRIGGER IF EXISTS trg_set_users_created_by_default ON users;

CREATE TRIGGER trg_set_users_created_by_default
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION set_users_created_by_default();
```

## Entity Files

The following entities will be automatically created:
- `users` - User management
- `exams` - Exam information
- `exam_submissions` - Student exam submissions
- `exam_sessions` - Exam session tracking
- `subjects` - Subject management
- `questionnaires` - Question management
- `choices` - Multiple choice options
- `questions` - Question details
