require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const util = require('util');
const execPromise = util.promisify(exec);

// Local database configuration
const localConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Lumia635-',
  database: process.env.NODE_ENV === 'test' ? 'big_way_test_db' : 'big_way_db',
};

// Render.com database configuration
const renderConfig = {
  connectionString: 'postgresql://big_way_main_user:EV1I0ber4F9YewNwz6ojKN2FSQrZuoqq@dpg-cvmhjfogjchc73d3qhag-a/big_way_main',
  ssl: {
    rejectUnauthorized: false
  }
};

// Temporary file paths
const DUMP_FILE = path.join(__dirname, 'full-render-dump.sql');
const FIXED_DUMP_FILE = path.join(__dirname, 'fixed-render-dump.sql');

// Function to dump the local database
async function dumpLocalDatabase() {
  console.log('Dumping local database...');
  
  try {
    // Create pg_dump command with proper credentials
    const pgDumpCmd = `PGPASSWORD="${localConfig.password}" pg_dump -h ${localConfig.host} -p ${localConfig.port} -U ${localConfig.user} -d ${localConfig.database} --no-owner --no-acl > ${DUMP_FILE}`;
    
    // Execute pg_dump
    await execPromise(pgDumpCmd);
    console.log(`✓ Database dump created at ${DUMP_FILE}`);
    return true;
  } catch (error) {
    console.error('Error dumping database:', error);
    return false;
  }
}

// Function to fix known issues in the dump file
async function fixDumpFile() {
  console.log('Fixing dump file for Render.com compatibility...');
  
  try {
    // Read the dump file
    let dumpContent = fs.readFileSync(DUMP_FILE, 'utf8');
    
    // Fix known issues based on memories
    
    // 1. Fix steering_wheel field constraints
    dumpContent = dumpContent.replace(/,\s*steering_wheel\s*character varying\([^)]+\)[^,)]*,/g, ',');
    dumpContent = dumpContent.replace(/,\s*steering_wheel\s*=\s*'[^']*'/g, '');
    
    // 2. Fix transmission field constraints
    dumpContent = dumpContent.replace(/,\s*transmission\s*character varying\([^)]+\)[^,)]*,/g, ',');
    dumpContent = dumpContent.replace(/,\s*transmission\s*=\s*'[^']*'/g, '');
    
    // 3. Fix doors field constraints
    dumpContent = dumpContent.replace(/,\s*doors\s*integer[^,)]*,/g, ',');
    dumpContent = dumpContent.replace(/,\s*doors\s*=\s*\d+/g, '');
    
    // 4. Fix location_type field constraints
    dumpContent = dumpContent.replace(/location_type\s*=\s*'dealer'/g, "location_type = 'city'");
    
    // 5. Fix car_images table url/image_url issue
    dumpContent = dumpContent.replace(/\(car_id,\s*url,/g, '(car_id, image_url,');
    dumpContent = dumpContent.replace(/VALUES\s*\(\$\d+,\s*\$\d+,/g, 'VALUES ($1, $2,');
    
    // 6. Fix categories.type NULL values
    dumpContent = dumpContent.replace(/type\s*=\s*NULL/g, "type = 'other'");
    
    // 7. Remove references to non-existent tables
    dumpContent = dumpContent.replace(/CREATE TABLE.*?backup_categories[\s\S]*?;\n\n/g, '');
    
    // 8. Create models table if it doesn't exist
    const createModelsTable = `
CREATE TABLE IF NOT EXISTS public.models (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    brand_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS public.models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;

ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);
`;
    
    // Add models table creation at the beginning of the dump
    dumpContent = dumpContent.replace(/SET row_security = off;/, `SET row_security = off;\n\n${createModelsTable}`);
    
    // Write the fixed content to a new file
    fs.writeFileSync(FIXED_DUMP_FILE, dumpContent);
    console.log(`✓ Fixed dump file created at ${FIXED_DUMP_FILE}`);
    return true;
  } catch (error) {
    console.error('Error fixing dump file:', error);
    return false;
  }
}

// Function to import the fixed dump to Render.com database
async function importToRenderDatabase() {
  console.log('Importing to Render.com database...');
  
  const renderPool = new Pool(renderConfig);
  
  try {
    // First, connect and drop all existing tables (clean slate)
    const client = await renderPool.connect();
    console.log('Connected to Render.com database');
    
    try {
      // Drop all existing tables (if any)
      console.log('Dropping existing tables...');
      await client.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);
      console.log('✓ Existing tables dropped');
      
      // Read the fixed dump file
      const fixedDumpContent = fs.readFileSync(FIXED_DUMP_FILE, 'utf8');
      
      // Execute the dump content
      console.log('Importing data...');
      await client.query(fixedDumpContent);
      console.log('✓ Data imported successfully');
      
      return true;
    } catch (error) {
      console.error('Error importing to Render.com database:', error);
      return false;
    } finally {
      client.release();
      await renderPool.end();
    }
  } catch (error) {
    console.error('Error connecting to Render.com database:', error);
    return false;
  }
}

// Main function to orchestrate the migration
async function migrateToRender() {
  console.log('Starting migration to Render.com database...');
  
  // Step 1: Dump local database
  const dumpSuccess = await dumpLocalDatabase();
  if (!dumpSuccess) {
    console.error('Failed to dump local database. Migration aborted.');
    return;
  }
  
  // Step 2: Fix dump file
  const fixSuccess = await fixDumpFile();
  if (!fixSuccess) {
    console.error('Failed to fix dump file. Migration aborted.');
    return;
  }
  
  // Step 3: Import to Render.com database
  const importSuccess = await importToRenderDatabase();
  if (!importSuccess) {
    console.error('Failed to import to Render.com database. Migration aborted.');
    return;
  }
  
  console.log('✓ Migration completed successfully!');
}

// Run the migration
migrateToRender().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
