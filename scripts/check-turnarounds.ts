import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { query } from '../lib/db';

async function checkTurnarounds() {
  const result = await query("SELECT id, name, category, production_days FROM turnarounds WHERE category = 'economy' ORDER BY display_order");
  console.log('Economy turnarounds:');
  result.rows.forEach(r => console.log(`  ${r.id}: ${r.name} (${r.production_days} days)`));
  process.exit(0);
}

checkTurnarounds().catch(e => { console.error(e); process.exit(1); });
