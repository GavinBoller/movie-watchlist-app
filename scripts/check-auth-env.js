// A simple script to verify that NextAuth can see the environment variables
require('dotenv').config({ path: '.env.local' });

console.log('Environment Variable Check:');
console.log('============================');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Not set');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set (hidden)' : '❌ Not set');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 
  `✅ Set (starts with ${process.env.GOOGLE_CLIENT_ID.substring(0, 8)}...)` : '❌ Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 
  `✅ Set (starts with ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 4)}...)` : '❌ Not set');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.log('\n⚠️ Missing Google OAuth credentials!');
  console.log('This is likely causing your authentication error.');
  console.log('Run ./scripts/setup-google-oauth.sh to set up your credentials.');
}

if (!process.env.NEXTAUTH_SECRET) {
  console.log('\n⚠️ Missing NEXTAUTH_SECRET!');
  console.log('This could cause session security issues.');
  console.log('Run ./scripts/setup-google-oauth.sh to set up a secure secret.');
}
