// TMDB API Key Validator
// This script helps you verify if your TMDB API key is working correctly
require('dotenv').config({ path: '.env.local' });

const validateTmdbKey = async () => {
  console.log('TMDB API Key Validator');
  console.log('=====================');
  
  // Check if TMDB_API_KEY is set
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: TMDB_API_KEY is not set in your .env.local file');
    console.log('Please add it to your .env.local file as:');
    console.log('TMDB_API_KEY=your-api-key-here');
    return;
  }
  
  if (apiKey === 'your-tmdb-api-key-here') {
    console.error('❌ Error: You need to replace the placeholder with your actual TMDB API key');
    console.log('Please update your .env.local file with your real API key');
    return;
  }
  
  console.log(`✅ TMDB_API_KEY is set (first 4 chars: ${apiKey.substring(0, 4)}...)`);
  
  // Test the API key with a simple request
  try {
    console.log('Testing API key with a genres request...');
    const response = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid! Successfully fetched genres:');
      console.log(`Found ${data.genres.length} movie genres`);
      console.log('Example genres: ' + data.genres.slice(0, 3).map(g => g.name).join(', '));
    } else {
      const error = await response.json();
      console.error('❌ API key validation failed with status:', response.status);
      console.error('Error details:', error);
      
      if (response.status === 401) {
        console.log('\nThis typically means your API key is invalid or unauthorized.');
        console.log('Please check your TMDB account and make sure the API key is correct.');
      } else if (response.status === 404) {
        console.log('\nThe API endpoint could not be found. This might be due to API changes.');
      } else if (response.status === 429) {
        console.log('\nYou have exceeded your rate limit. Try again later.');
      }
    }
  } catch (error) {
    console.error('❌ Failed to test API key:', error.message);
    console.log('This might be a network issue. Check your internet connection.');
  }
};

validateTmdbKey();
