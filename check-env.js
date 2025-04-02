require('dotenv').config();

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL format check:', process.env.DATABASE_URL ? 
  process.env.DATABASE_URL.startsWith('postgresql://') : 'N/A');

// Don't print the actual URL for security reasons
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  console.log('Connection components:');
  console.log('- Protocol:', url.protocol);
  console.log('- Username exists:', !!url.username);
  console.log('- Password exists:', !!url.password);
  console.log('- Host:', url.hostname);
  console.log('- Port:', url.port || 'default');
  console.log('- Database name exists:', !!url.pathname.substring(1));
}
