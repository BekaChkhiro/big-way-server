const pool = require('../../config/db.config');

async function addAuthorColumns() {
  const client = await pool.connect();
  try {
    console.log('ვამატებთ ავტორის სვეტებს cars ცხრილში...');
    
    // დაწყება ტრანზაქციის
    await client.query('BEGIN');
    
    // სვეტების დამატება
    await client.query(`
      ALTER TABLE cars 
      ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS author_phone VARCHAR(50)
    `);
    
    console.log('სვეტები წარმატებით დაემატა!');
    
    // არსებული ჩანაწერების განახლება მომხმარებლების ინფორმაციით (კომენტარებშია)
    // როგორც ჩანს, იყო კომენტარებში, ამიტომ არ გავუშვებთ
    /*
    console.log('ვანახლებთ არსებულ ჩანაწერებს მომხმარებლების ინფორმაციით...');
    await client.query(`
      UPDATE cars c
      SET author_name = CONCAT(u.first_name, ' ', u.last_name),
          author_phone = u.phone
      FROM users u
      WHERE c.seller_id = u.id
    `);
    console.log('არსებული ჩანაწერები განახლდა!');
    */
    
    // დასრულება ტრანზაქციის
    await client.query('COMMIT');
    
    console.log('მიგრაცია წარმატებით დასრულდა!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('შეცდომა მიგრაციისას:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

// გაშვება
addAuthorColumns();
