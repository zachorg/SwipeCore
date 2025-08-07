// Natural Language Processing for Restaurant Filters
// Converts plain language queries into filter definitions

import { FilterDefinition, FilterValue, FILTER_DEFINITIONS } from '@/hooks/useFilters';

export interface ParsedFilter {
  filterId: string;
  value: FilterValue;
}

export interface NLPResult {
  filters: ParsedFilter[];
  confidence: number;
  originalQuery: string;
  interpretedAs: string;
}

// Keywords mapping for different filter types
const KEYWORD_MAPPINGS = {
  // Price keywords
  price: {
    cheap: 1,
    inexpensive: 1,
    budget: 1,
    affordable: 1,
    moderate: 2,
    expensive: 3,
    pricey: 3,
    upscale: 4,
    'fine dining': 4,
    luxury: 4
  },

  // Cuisine keywords
  cuisine: {
    italian: 'italian',
    pizza: 'italian',
    pasta: 'italian',
    chinese: 'chinese',
    asian: 'chinese',
    mexican: 'mexican',
    taco: 'mexican',
    burrito: 'mexican',
    indian: 'indian',
    curry: 'indian',
    japanese: 'japanese',
    sushi: 'japanese',
    ramen: 'japanese',
    american: 'american',
    burger: 'american',
    thai: 'thai',
    'pad thai': 'thai',
    french: 'french'
  },

  // Dietary restrictions
  dietary: {
    vegetarian: 'vegetarian',
    veggie: 'vegetarian',
    vegan: 'vegan',
    'plant based': 'vegan',
    'gluten free': 'gluten-free',
    'dairy free': 'dairy-free',
    halal: 'halal',
    kosher: 'kosher',
    keto: 'keto'
  },

  // Restaurant features
  features: {
    'outdoor seating': 'outdoor-seating',
    patio: 'outdoor-seating',
    terrace: 'outdoor-seating',
    parking: 'parking',
    delivery: 'delivery',
    takeout: 'takeout',
    'take out': 'takeout',
    wifi: 'wifi',
    'live music': 'live-music',
    bar: 'bar',
    'happy hour': 'happy-hour'
  },

  // Ambiance
  ambiance: {
    casual: 'casual',
    'fine dining': 'fine-dining',
    upscale: 'fine-dining',
    'family friendly': 'family-friendly',
    romantic: 'romantic',
    quiet: 'quiet',
    lively: 'lively',
    trendy: 'trendy',
    'sports bar': 'sports-bar'
  },

  // Time/status keywords
  time: {
    'open now': true,
    'open late': true,
    'currently open': true,
    'still open': true
  },

  // Rating keywords
  rating: {
    'highly rated': 4.0,
    'good reviews': 3.5,
    'top rated': 4.5,
    'best': 4.5,
    'excellent': 4.5
  }
};

// Common phrases and their interpretations
const PHRASE_PATTERNS = [
  {
    pattern: /show me (.*)/i,
    handler: (match: string[]) => `Looking for ${match[1]}`
  },
  {
    pattern: /find (.*)/i,
    handler: (match: string[]) => `Searching for ${match[1]}`
  },
  {
    pattern: /i want (.*)/i,
    handler: (match: string[]) => `You want ${match[1]}`
  },
  {
    pattern: /looking for (.*)/i,
    handler: (match: string[]) => `Looking for ${match[1]}`
  }
];

/**
 * Parse natural language query into filter definitions
 */
export function parseNaturalLanguageQuery(query: string): NLPResult {
  const normalizedQuery = query.toLowerCase().trim();
  const filters: ParsedFilter[] = [];
  let confidence = 0;
  let interpretedParts: string[] = [];

  // Extract price filters
  const priceFilter = extractPriceFilter(normalizedQuery);
  if (priceFilter) {
    filters.push(priceFilter);
    confidence += 0.2;
    interpretedParts.push(`price: ${getPriceLabel(priceFilter.value as number)}`);
  }

  // Extract cuisine filters
  const cuisineFilters = extractCuisineFilters(normalizedQuery);
  if (cuisineFilters.length > 0) {
    filters.push({
      filterId: 'cuisine',
      value: cuisineFilters
    });
    confidence += 0.3;
    interpretedParts.push(`cuisine: ${cuisineFilters.join(', ')}`);
  }

  // Extract dietary restriction filters
  const dietaryFilters = extractDietaryFilters(normalizedQuery);
  if (dietaryFilters.length > 0) {
    filters.push({
      filterId: 'dietaryRestrictions',
      value: dietaryFilters
    });
    confidence += 0.2;
    interpretedParts.push(`dietary: ${dietaryFilters.join(', ')}`);
  }

  // Extract feature filters
  const featureFilters = extractFeatureFilters(normalizedQuery);
  if (featureFilters.length > 0) {
    filters.push({
      filterId: 'restaurantFeatures',
      value: featureFilters
    });
    confidence += 0.2;
    interpretedParts.push(`features: ${featureFilters.join(', ')}`);
  }

  // Extract ambiance filters
  const ambianceFilters = extractAmbianceFilters(normalizedQuery);
  if (ambianceFilters.length > 0) {
    filters.push({
      filterId: 'ambiance',
      value: ambianceFilters
    });
    confidence += 0.15;
    interpretedParts.push(`ambiance: ${ambianceFilters.join(', ')}`);
  }

  // Extract open now filter
  if (extractOpenNowFilter(normalizedQuery)) {
    filters.push({
      filterId: 'openNow',
      value: true
    });
    confidence += 0.1;
    interpretedParts.push('currently open');
  }

  // Extract rating filter
  const ratingFilter = extractRatingFilter(normalizedQuery);
  if (ratingFilter) {
    filters.push(ratingFilter);
    confidence += 0.15;
    interpretedParts.push(`rating: ${ratingFilter.value}+ stars`);
  }

  // Generate interpretation
  let interpretedAs = 'No specific filters detected';
  if (interpretedParts.length > 0) {
    interpretedAs = `Restaurants with ${interpretedParts.join(', ')}`;
  }

  // Apply phrase patterns for better interpretation
  for (const pattern of PHRASE_PATTERNS) {
    const match = normalizedQuery.match(pattern.pattern);
    if (match) {
      interpretedAs = pattern.handler(match);
      break;
    }
  }

  return {
    filters,
    confidence: Math.min(confidence, 1.0),
    originalQuery: query,
    interpretedAs
  };
}

/**
 * Extract price filter from query
 */
function extractPriceFilter(query: string): ParsedFilter | null {
  for (const [keyword, value] of Object.entries(KEYWORD_MAPPINGS.price)) {
    if (query.includes(keyword)) {
      return {
        filterId: 'priceLevel',
        value: value
      };
    }
  }
  return null;
}

/**
 * Extract cuisine filters from query
 */
function extractCuisineFilters(query: string): string[] {
  const cuisines: string[] = [];
  for (const [keyword, value] of Object.entries(KEYWORD_MAPPINGS.cuisine)) {
    if (query.includes(keyword) && !cuisines.includes(value)) {
      cuisines.push(value);
    }
  }
  return cuisines;
}

/**
 * Extract dietary restriction filters from query
 */
function extractDietaryFilters(query: string): string[] {
  const dietary: string[] = [];
  for (const [keyword, value] of Object.entries(KEYWORD_MAPPINGS.dietary)) {
    if (query.includes(keyword) && !dietary.includes(value)) {
      dietary.push(value);
    }
  }
  return dietary;
}

/**
 * Extract feature filters from query
 */
function extractFeatureFilters(query: string): string[] {
  const features: string[] = [];
  for (const [keyword, value] of Object.entries(KEYWORD_MAPPINGS.features)) {
    if (query.includes(keyword) && !features.includes(value)) {
      features.push(value);
    }
  }
  return features;
}

/**
 * Extract ambiance filters from query
 */
function extractAmbianceFilters(query: string): string[] {
  const ambiance: string[] = [];
  for (const [keyword, value] of Object.entries(KEYWORD_MAPPINGS.ambiance)) {
    if (query.includes(keyword) && !ambiance.includes(value)) {
      ambiance.push(value);
    }
  }
  return ambiance;
}

/**
 * Extract open now filter from query
 */
function extractOpenNowFilter(query: string): boolean {
  for (const keyword of Object.keys(KEYWORD_MAPPINGS.time)) {
    if (query.includes(keyword)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract rating filter from query
 */
function extractRatingFilter(query: string): ParsedFilter | null {
  for (const [keyword, value] of Object.entries(KEYWORD_MAPPINGS.rating)) {
    if (query.includes(keyword)) {
      return {
        filterId: 'minRating',
        value: value
      };
    }
  }
  return null;
}

/**
 * Get human-readable price label
 */
function getPriceLabel(priceLevel: number): string {
  const labels = {
    1: 'inexpensive',
    2: 'moderate',
    3: 'expensive',
    4: 'very expensive'
  };
  return labels[priceLevel as keyof typeof labels] || 'unknown';
}

/**
 * Example queries for testing
 */
export const EXAMPLE_QUERIES = [
  "Show me cheap Italian restaurants open late",
  "Find vegetarian places with outdoor seating",
  "I want expensive sushi with parking",
  "Looking for family friendly pizza places",
  "Show me highly rated Thai restaurants with delivery",
  "Find romantic fine dining with live music",
  "Cheap burgers open now",
  "Vegan restaurants with wifi",
  "Upscale steakhouse with bar"
];

/**
 * Debug function to test NLP parsing in browser console
 * Usage: testNLP("Show me cheap Italian restaurants")
 */
export function testNLP(query: string): void {
  console.log(`🔍 Testing query: "${query}"`);
  const result = parseNaturalLanguageQuery(query);

  console.log(`✨ Interpreted as: ${result.interpretedAs}`);
  console.log(`🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
  console.log(`📊 Detected ${result.filters.length} filters:`);

  result.filters.forEach((filter, index) => {
    console.log(`  ${index + 1}. ${filter.filterId}: ${Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}`);
  });

  return result;
}

// Make testNLP available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testNLP = testNLP;
}
