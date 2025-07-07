// Migration script to fix HTML-encoded poster paths
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixEncodedPosters() {
  try {
    console.log('Finding and fixing HTML-encoded poster paths...');
    
    // Find items with HTML-encoded poster paths
    const itemsWithEncodedPosters = await prisma.watchlistItem.findMany({
      where: {
        poster: {
          contains: '&#x2F;'
        }
      },
      select: {
        id: true,
        title: true,
        poster: true
      }
    });
    
    console.log(`Found ${itemsWithEncodedPosters.length} items with encoded poster paths:`);
    
    for (const item of itemsWithEncodedPosters) {
      const originalPoster = item.poster;
      
      // Decode HTML entities
      const decodedPoster = originalPoster
        .replace(/&#x2F;/g, '/')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#39;/g, "'");
      
      console.log(`- ${item.title}`);
      console.log(`  Before: ${originalPoster}`);
      console.log(`  After:  ${decodedPoster}`);
      
      // Update the database
      await prisma.watchlistItem.update({
        where: { id: item.id },
        data: { poster: decodedPoster }
      });
    }
    
    console.log(`\nSuccessfully updated ${itemsWithEncodedPosters.length} poster paths!`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEncodedPosters();
