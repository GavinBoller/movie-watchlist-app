// Diagnostic script to find items with missing posters
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findItemsWithMissingPosters() {
  try {
    console.log('Finding items with missing posters...');
    
    const itemsWithNullPosters = await prisma.watchlistItem.findMany({
      where: {
        OR: [
          { poster: null },
          { poster: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        movieId: true,
        mediaType: true,
        poster: true
      },
      orderBy: {
        title: 'asc'
      }
    });
    
    console.log(`Found ${itemsWithNullPosters.length} items with missing posters:`);
    
    itemsWithNullPosters.forEach(item => {
      console.log(`- ${item.title} (ID: ${item.id}, TMDB ID: ${item.movieId}, Type: ${item.mediaType})`);
    });
    
    // Look for the specific items mentioned
    const specificItems = await prisma.watchlistItem.findMany({
      where: {
        title: {
          in: ['Inside Out Homes', 'The Narrow Road to the Deep North']
        }
      },
      select: {
        id: true,
        title: true,
        movieId: true,
        mediaType: true,
        poster: true
      }
    });
    
    console.log('\nSpecific items mentioned:');
    specificItems.forEach(item => {
      console.log(`- ${item.title}: poster = "${item.poster}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findItemsWithMissingPosters();
