const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkDatabase() {
  try {
    console.log('Checking database...');
    
    // Check users table
    const usersResult = await pool.query('SELECT id, name, email FROM users LIMIT 10');
    console.log('\nUsers in database:');
    usersResult.rows.forEach(row => {
      console.log(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
    });
    
    // Check watchlist count by user
    const watchlistCountResult = await pool.query(`
      SELECT user_id, COUNT(*) as count 
      FROM watchlist 
      GROUP BY user_id 
      ORDER BY count DESC 
      LIMIT 10
    `);
    console.log('\nWatchlist counts by user:');
    watchlistCountResult.rows.forEach(row => {
      console.log(`User ID: ${row.user_id}, Count: ${row.count}`);
    });
    
    // Check total watchlist items
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM watchlist');
    console.log(`\nTotal watchlist items: ${totalResult.rows[0].total}`);
    
    // Check accounts table
    const accountsResult = await pool.query('SELECT "userId", provider, "providerAccountId" FROM accounts LIMIT 10');
    console.log('\nAccounts in database:');
    accountsResult.rows.forEach(row => {
      console.log(`User ID: ${row.userId}, Provider: ${row.provider}, Provider Account ID: ${row.providerAccountId}`);
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
