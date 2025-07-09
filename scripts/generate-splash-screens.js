#!/usr/bin/env node

// A simple script to generate splash screens for iOS PWA
// Run this with `node scripts/generate-splash-screens.js` before building your app

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');

const execAsync = promisify(exec);
const splashDir = path.join(__dirname, '../public/splash');

// Create splash directory if it doesn't exist
if (!fs.existsSync(splashDir)) {
  fs.mkdirSync(splashDir, { recursive: true });
  console.log('Created splash directory');
}

// The source icon to use for splash screens
const sourceIcon = path.join(__dirname, '../public/android-chrome-512x512.png');

// Splash screen configurations for iOS
const splashScreens = [
  { name: 'apple-splash-2048-2732.png', width: 2048, height: 2732 }, // 12.9" iPad Pro
  { name: 'apple-splash-1668-2388.png', width: 1668, height: 2388 }, // 11" iPad Pro
  { name: 'apple-splash-1536-2048.png', width: 1536, height: 2048 }, // 9.7" iPad
  { name: 'apple-splash-1242-2208.png', width: 1242, height: 2208 }, // iPhone 8 Plus
  { name: 'apple-splash-1125-2436.png', width: 1125, height: 2436 }, // iPhone X/XS/11 Pro
  { name: 'apple-splash-750-1334.png', width: 750, height: 1334 },   // iPhone 8/SE
  { name: 'apple-splash-640-1136.png', width: 640, height: 1136 }    // iPhone 5/SE
];

// Generate splash screens using ImageMagick if available, otherwise just copy the icon
async function generateSplashScreens() {
  try {
    // Check if ImageMagick is available
    await execAsync('which convert');
    
    console.log('Generating iOS splash screens with ImageMagick...');
    
    // Generate each splash screen
    for (const screen of splashScreens) {
      const outputPath = path.join(splashDir, screen.name);
      const backgroundColor = '#1A1A1A'; // Match your app's background color
      
      // Create a splash screen with the icon centered on a colored background
      await execAsync(
        `convert -size ${screen.width}x${screen.height} canvas:${backgroundColor} ` +
        `${sourceIcon} -resize ${Math.min(screen.width, screen.height) * 0.5}x${Math.min(screen.width, screen.height) * 0.5} ` +
        `-gravity center -composite ${outputPath}`
      );
      
      console.log(`Created ${screen.name}`);
    }
    
    console.log('Successfully generated all splash screens!');
  } catch (error) {
    console.log('ImageMagick not found. Using simple file copies instead...');
    
    // If ImageMagick is not available, just copy the icon as a fallback
    for (const screen of splashScreens) {
      const outputPath = path.join(splashDir, screen.name);
      fs.copyFileSync(sourceIcon, outputPath);
      console.log(`Copied icon to ${screen.name} (without resizing)`);
    }
  }
}

// Run the generator
generateSplashScreens().catch(error => {
  console.error('Error generating splash screens:', error);
  process.exit(1);
});
