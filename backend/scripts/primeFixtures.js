#!/usr/bin/env node

/**
 * Prime Fixtures Script
 * 
 * This script warms up the fixture cache by making real API calls
 * and saving the responses as JSON fixtures for development/testing.
 * 
 * Usage: npm run prime
 */

// Load environment variables from .env file
require('dotenv-flow').config();

const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');

// Sample requests to prime fixtures with
const SAMPLE_REQUESTS = [
  {
    type: 'nearby',
    params: {
      lat: 40.7128,
      lng: -74.0060,
      radius: 1500,
      keyword: 'restaurant'
    }
  },
  {
    type: 'nearby', 
    params: {
      lat: 37.7749,
      lng: -122.4194,
      radius: 2000,
      keyword: 'coffee'
    }
  },
  {
    type: 'nearby',
    params: {
      lat: 34.0522,
      lng: -118.2437,
      radius: 1000,
      type: 'restaurant'
    }
  }
];

async function primeFixtures() {
  console.log('🔄 Priming fixtures...');
  
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY not found in environment');
    process.exit(1);
  }

  const fixtureDir = process.env.FIXTURE_DIR || './test/fixtures';
  
  // Ensure fixture directory exists
  await fs.mkdir(fixtureDir, { recursive: true });

  let successCount = 0;
  let errorCount = 0;

  for (const request of SAMPLE_REQUESTS) {
    try {
      console.log(`📡 Making ${request.type} request:`, JSON.stringify(request.params));
      
      let response;
      if (request.type === 'nearby') {
        const requestBody = {
          includedTypes: request.params.type ? [request.params.type] : undefined,
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: {
                latitude: request.params.lat,
                longitude: request.params.lng,
              },
              radius: request.params.radius,
            },
          },
          languageCode: 'en',
        };

        response = await axios.post('https://places.googleapis.com/v1/places:searchNearby', requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos,places.types,places.location',
          },
        });
      }

      // Generate fixture key (simplified version of the hash logic)
      const crypto = require('crypto');
      const hash = crypto.createHash('sha1').update(JSON.stringify(request.params)).digest('hex');
      const fixtureKey = `${request.type}:${hash}`;
      // Windows-safe filename (replace : with _)
      const safeKey = fixtureKey.replace(/:/g, '_');
      const fixturePath = path.join(fixtureDir, `${safeKey}.json`);

      // Write fixture atomically
      try {
        await fs.writeFile(fixturePath, JSON.stringify(response.data, null, 2), { flag: 'wx' });
        console.log(`✅ Fixture written: ${safeKey}.json`);
        successCount++;
      } catch (writeError) {
        if (writeError.code === 'EEXIST') {
          console.log(`⚡ Fixture already exists: ${safeKey}.json`);
          successCount++;
        } else {
          throw writeError;
        }
      }

    } catch (error) {
      console.error(`❌ Error priming fixture:`, error.message);
      errorCount++;
    }

    // Rate limiting - be nice to Google's API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Results: ${successCount} successful, ${errorCount} errors`);
  
  if (errorCount > 0) {
    console.log('⚠️  Some fixtures failed to prime. Check your API key and network connection.');
    process.exit(1);
  } else {
    console.log('🎉 All fixtures primed successfully!');
  }
}

// Run the script
primeFixtures().catch(error => {
  console.error('💥 Prime fixtures script failed:', error);
  process.exit(1);
});