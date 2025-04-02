require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');

// Get database configuration from your existing config
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Lumia635-',
  database: process.env.NODE_ENV === 'test' ? 'big_way_test_db' : 'big_way_db'
};

// Output file path
const outputFile = path.join(__dirname, 'full-dump.sql');

// Build pg_dump command
const pgDumpCmd = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f ${outputFile}`;

console.log('Exporting database to SQL dump...');
exec(pgDumpCmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error exporting database: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`pg_dump stderr: ${stderr}`);
    return;
  }
  console.log(`Database successfully exported to ${outputFile}`);
  console.log('You can now upload this file to your Render.com database');
});
