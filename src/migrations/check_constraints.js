/**
 * Script to check all constraints on the specifications table
 */
const { pg: pool } = require('../../config/db.config');

async function checkConstraints() {
  const client = await pool.connect();
  try {
    console.log('Checking all constraints on specifications table...');
    
    const constraintsQuery = `
      SELECT con.conname AS constraint_name,
             pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'specifications'
      ORDER BY con.contype, con.conname;
    `;
    
    const result = await client.query(constraintsQuery);
    
    console.log('Found constraints:');
    result.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.constraint_name}: ${row.constraint_definition}`);
    });
    
    console.log('\nSpecifically checking for steering_wheel constraints:');
    const steeringWheelConstraints = result.rows.filter(row => 
      row.constraint_name.includes('steering_wheel') || 
      row.constraint_definition.includes('steering_wheel')
    );
    
    if (steeringWheelConstraints.length === 0) {
      console.log('No steering_wheel constraints found.');
    } else {
      steeringWheelConstraints.forEach((row, i) => {
        console.log(`${i+1}. ${row.constraint_name}: ${row.constraint_definition}`);
      });
    }
  } catch (error) {
    console.error('Error checking constraints:', error);
  } finally {
    client.release();
    pool.end();
  }
}

checkConstraints();
