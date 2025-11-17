import { config } from 'dotenv';
import path from 'path';
import { createUser } from './queries/users';
import { seedProducts } from './seed-products';

// Load .env.local file
config({ path: path.join(__dirname, '../../.env.local') });

async function seed() {
  console.log('Starting database seeding...\n');

  try {
    // Create admin user: ira@irawatkins.com
    console.log('Creating admin user: ira@irawatkins.com');
    try {
      await createUser({
        email: 'ira@irawatkins.com',
        password: 'Bobby321!',
        name: 'Ira Watkins',
        role: 'admin',
      });
      console.log('✓ Admin user created: ira@irawatkins.com\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠ Admin user already exists: ira@irawatkins.com\n');
      } else {
        throw error;
      }
    }

    // Create secondary admin user: iradwatkins@gmail.com
    console.log('Creating secondary admin user: iradwatkins@gmail.com');
    try {
      await createUser({
        email: 'iradwatkins@gmail.com',
        password: 'Bobby321!',
        name: 'Ira Watkins',
        role: 'admin',
      });
      console.log('✓ Admin user created: iradwatkins@gmail.com\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('⚠ Admin user already exists: iradwatkins@gmail.com\n');
      } else {
        throw error;
      }
    }

    // Seed products and categories
    console.log('---\n');
    await seedProducts();
    console.log('\n---');

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('Admin Accounts:');
    console.log('  1. ira@irawatkins.com / Bobby321!');
    console.log('  2. iradwatkins@gmail.com / Bobby321!');
    console.log('\nYou can now login at http://localhost:3001/login');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
