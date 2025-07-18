const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting dealer role migration...');
    
    // Check if dealer role already exists
    const checkRoleQuery = `
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'dealer' 
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'user_role'
      );
    `;
    
    const roleExists = await client.query(checkRoleQuery);
    
    if (roleExists.rows.length === 0) {
      // Add dealer role to enum
      await client.query("ALTER TYPE public.user_role ADD VALUE 'dealer' AFTER 'user';");
      console.log('✓ Added dealer role to user_role enum');
    } else {
      console.log('✓ Dealer role already exists in user_role enum');
    }
    
    // Check if dealer_profiles table exists
    const checkTableQuery = `
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'dealer_profiles';
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    if (tableExists.rows.length === 0) {
      // Create dealer_profiles table
      const createTableQuery = `
        CREATE TABLE public.dealer_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          company_name VARCHAR(255) NOT NULL,
          logo_url VARCHAR(500),
          phone VARCHAR(50),
          established_year INTEGER,
          website_url VARCHAR(500),
          social_media_url VARCHAR(500),
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_dealer_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
          CONSTRAINT check_established_year CHECK (established_year >= 1900 AND established_year <= EXTRACT(YEAR FROM CURRENT_DATE))
        );
      `;
      
      await client.query(createTableQuery);
      console.log('✓ Created dealer_profiles table');
      
      // Create indexes
      await client.query('CREATE INDEX idx_dealer_profiles_user_id ON public.dealer_profiles(user_id);');
      await client.query('CREATE INDEX idx_dealer_profiles_company_name ON public.dealer_profiles(company_name);');
      console.log('✓ Created indexes on dealer_profiles table');
      
      // Create trigger function
      const createTriggerFunctionQuery = `
        CREATE OR REPLACE FUNCTION update_dealer_profiles_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      await client.query(createTriggerFunctionQuery);
      
      // Create trigger
      const createTriggerQuery = `
        CREATE TRIGGER update_dealer_profiles_updated_at_trigger
        BEFORE UPDATE ON public.dealer_profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_dealer_profiles_updated_at();
      `;
      
      await client.query(createTriggerQuery);
      console.log('✓ Created updated_at trigger for dealer_profiles table');
    } else {
      console.log('✓ Dealer_profiles table already exists');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});