import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { runMigrations } from './db';

runMigrations()
  .then(() => {
    console.log('Migration complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
