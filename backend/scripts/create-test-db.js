const { Client } = require('pg');

const DEFAULT_URL = 'postgresql://postgres:password@localhost:5432/postgres';
const connectionString = process.env.DATABASE_URL || DEFAULT_URL;

const adminConnString = connectionString.replace(/\/[^/]*$/, '/postgres');

async function main() {
  const client = new Client({ connectionString: adminConnString });
  await client.connect();
  const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'workspace_test'");
  if (res.rows.length === 0) {
    await client.query('CREATE DATABASE workspace_test');
    console.log('Created database \'workspace_test\'');
  } else {
    console.log('Database \'workspace_test\' already exists');
  }
  await client.end();
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
