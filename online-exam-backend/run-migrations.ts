import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'al_irsyad_exam',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
});

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    await dataSource.initialize();
    
    console.log('📦 Running migrations...');
    await dataSource.runMigrations();
    
    console.log('✅ Migrations completed successfully!');
    
    // Show created tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

runMigrations();
