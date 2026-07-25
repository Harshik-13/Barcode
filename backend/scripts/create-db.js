const { Client } = require('pg');
const c = new Client({ connectionString: 'postgresql://postgres:Harshik@13@localhost:5432/postgres' });
c.connect().then(() => {
  return c.query("SELECT 1 FROM pg_database WHERE datname = 'workspace'");
}).then(r => {
  if (r.rows.length === 0) {
    return c.query('CREATE DATABASE workspace');
  }
}).then(() => {
  console.log('ready');
  return c.end();
}).catch(e => console.log(e.message));
