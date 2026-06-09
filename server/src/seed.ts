import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { runMigrations } from './db';
import { seed } from './seeder';

(async () => {
  await runMigrations();
  await seed();
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
