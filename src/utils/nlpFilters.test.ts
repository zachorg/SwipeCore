// Test file for Natural Language Processing filters
// Run this to see how different queries are interpreted

import { parseNaturalLanguageQuery } from './nlpFilters';

// Test queries and expected results
const testQueries = [
  {
    query: "Show me cheap Italian restaurants open late",
    expectedFilters: ['priceLevel', 'cuisine', 'openNow']
  },
  {
    query: "Find vegetarian places with outdoor seating",
    expectedFilters: ['dietaryRestrictions', 'restaurantFeatures']
  },
  {
    query: "I want expensive sushi with parking",
    expectedFilters: ['priceLevel', 'cuisine', 'restaurantFeatures']
  },
  {
    query: "Looking for family friendly pizza places",
    expectedFilters: ['ambiance', 'cuisine']
  },
  {
    query: "Show me highly rated Thai restaurants with delivery",
    expectedFilters: ['minRating', 'cuisine', 'restaurantFeatures']
  },
  {
    query: "Find romantic fine dining with live music",
    expectedFilters: ['ambiance', 'restaurantFeatures']
  },
  {
    query: "Cheap burgers open now",
    expectedFilters: ['priceLevel', 'cuisine', 'openNow']
  },
  {
    query: "Vegan restaurants with wifi",
    expectedFilters: ['dietaryRestrictions', 'restaurantFeatures']
  }
];

// Function to run tests (for development/debugging)
export function runNLPTests() {
  console.log('🧪 Running NLP Filter Tests\n');
  
  testQueries.forEach((test, index) => {
    console.log(`Test ${index + 1}: "${test.query}"`);
    
    const result = parseNaturalLanguageQuery(test.query);
    
    console.log(`  ✨ Interpreted as: ${result.interpretedAs}`);
    console.log(`  🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log(`  🔍 Detected filters:`);
    
    result.filters.forEach(filter => {
      console.log(`    - ${filter.filterId}: ${Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}`);
    });
    
    const detectedFilterIds = result.filters.map(f => f.filterId);
    const expectedFound = test.expectedFilters.filter(expected => 
      detectedFilterIds.includes(expected)
    );
    
    console.log(`  ✅ Expected filters found: ${expectedFound.length}/${test.expectedFilters.length}`);
    console.log('');
  });
}

// Example usage:
// import { runNLPTests } from './nlpFilters.test';
// runNLPTests();
