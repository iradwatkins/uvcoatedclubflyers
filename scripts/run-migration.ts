// Run database migration
import { promises as fs } from 'fs'
import path from 'path'
import pool from '../lib/db/index.js'

async function runMigration() {
  try {
    console.log('🔄 Running shipping tables migration...\n')

    // Read migration file
    const migrationPath = path.join(process.cwd(), 'lib/db/migrations/009_add_shipping_tables.sql')
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8')

    // Execute migration
    await pool.query(migrationSQL)

    console.log('✅ Migration completed successfully!\n')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
