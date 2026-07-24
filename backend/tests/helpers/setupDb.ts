import { initDb } from '../../src/db';
import { migrate } from '../../src/db/migrate';
import { seed } from '../../src/db/seed';

async function setup(): Promise<void> {
  await initDb();
  await migrate({ skipClose: true });
  await seed({ skipClose: true });
}

setup();
