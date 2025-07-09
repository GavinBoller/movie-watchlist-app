require('dotenv').config();
const { Pool } = require('@neondatabase/serverless');
const WebSocket = require('ws');

// Set up WebSocket for Neon serverless
global.WebSocket = WebSocket;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUsersAndAccounts() {
  try {
    console.log('Checking users table...');
    const users = await pool.query('SELECT id, name, email, country FROM users ORDER BY "createdAt" DESC LIMIT 5');
    console.log('Users:');
    users.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Country: ${row.country}`);
    });

    console.log('\nChecking accounts table...');
    const accounts = await pool.query('SELECT "userId", provider, "providerAccountId" FROM accounts ORDER BY "userId" LIMIT 5');
    console.log('Accounts:');
    accounts.rows.forEach(row => {
      console.log(`  UserID: ${row.userId}, Provider: ${row.provider}, ProviderAccountId: ${row.providerAccountId}`);
    });

    console.log('\nChecking joined data...');
    const joined = await pool.query(`
      SELECT u.id, u.name, u.email, u.country, a.provider, a."providerAccountId" 
      FROM users u 
      JOIN accounts a ON u.id = a."userId" 
      ORDER BY u."createdAt" DESC 
      LIMIT 3
    `);
    console.log('Joined data:');
    joined.rows.forEach(row => {
      console.log(`  UserID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Country: ${row.country}, Provider: ${row.provider}, ProviderAccountId: ${row.providerAccountId}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsersAndAccounts();
