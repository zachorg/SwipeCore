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
    'low cost': 1,
    'budget friendly': 1,
    'not expensive': 1,
    'under $10': 1,
    'under $15': 1,
    '$': 1,
    moderate: 2,
    'mid range': 2,
    'medium priced': 2,
    'reasonably priced': 2,
    'middle of the road': 2,
    'average price': 2,
    '$$': 2,
    expensive: 3,
    pricey: 3,
    'high end': 3,
    'not cheap': 3,
    '$$$': 3,
    upscale: 4,
    'fine dining': 4,
    luxury: 4,
    'top tier': 4,
    'premium': 4,
    'gourmet': 4,
    '$$$$': 4
  },

  // Cuisine keywords - expanded with more options and variations
  cuisine: {
    // Italian
    italian: 'italian',
    pizza: 'italian',
    pasta: 'italian',
    'pizza place': 'italian',
    pizzeria: 'italian',
    'italian food': 'italian',

    // Chinese
    chinese: 'chinese',
    'chinese food': 'chinese',
    'dim sum': 'chinese',
    'szechuan': 'chinese',
    'sichuan': 'chinese',
    'cantonese': 'chinese',

    // Asian variations
    asian: 'asian',
    'asian fusion': 'asian',
    'pan asian': 'asian',

    // Mexican
    mexican: 'mexican',
    taco: 'mexican',
    burrito: 'mexican',
    'mexican food': 'mexican',
    'tex mex': 'mexican',
    'tex-mex': 'mexican',
    quesadilla: 'mexican',
    enchilada: 'mexican',

    // Indian
    indian: 'indian',
    curry: 'indian',
    'indian food': 'indian',
    'south asian': 'indian',
    tandoori: 'indian',
    'naan': 'indian',

    // Japanese
    japanese: 'japanese',
    sushi: 'japanese',
    ramen: 'japanese',
    'japanese food': 'japanese',
    tempura: 'japanese',
    'sushi bar': 'japanese',
    'sushi place': 'japanese',

    // American
    american: 'american',
    burger: 'american',
    'burger joint': 'american',
    'american food': 'american',
    'burgers': 'american',
    'hot dog': 'american',
    'diner': 'american',

    // Thai
    thai: 'thai',
    'pad thai': 'thai',
    'thai food': 'thai',

    // French
    french: 'french',
    'french food': 'french',
    'french cuisine': 'french',
    'bistro': 'french',

    // Additional cuisines
    greek: 'greek',
    mediterranean: 'mediterranean',
    'middle eastern': 'middle-eastern',
    lebanese: 'middle-eastern',
    korean: 'korean',
    'korean bbq': 'korean',
    vietnamese: 'vietnamese',
    pho: 'vietnamese',
    spanish: 'spanish',
    tapas: 'spanish',
    seafood: 'seafood',
    'fish': 'seafood',
    steakhouse: 'steakhouse',
    steak: 'steakhouse',
    bbq: 'bbq',
    barbecue: 'bbq',
    'bbq place': 'bbq',
    breakfast: 'breakfast',
    brunch: 'breakfast',
    coffee: 'cafe',
    cafe: 'cafe',
    dessert: 'dessert',
    'ice cream': 'dessert',
    bakery: 'bakery',
    pastry: 'bakery'
  },

  // Dietary restrictions - expanded
  dietary: {
    vegetarian: 'vegetarian',
    veggie: 'vegetarian',
    'vegetarian options': 'vegetarian',
    'vegetarian friendly': 'vegetarian',
    vegan: 'vegan',
    'plant based': 'vegan',
    'vegan options': 'vegan',
    'vegan friendly': 'vegan',
    'gluten free': 'gluten-free',
    'gluten-free': 'gluten-free',
    'no gluten': 'gluten-free',
    'dairy free': 'dairy-free',
    'dairy-free': 'dairy-free',
    'lactose free': 'dairy-free',
    'no dairy': 'dairy-free',
    halal: 'halal',
    'halal food': 'halal',
    kosher: 'kosher',
    'kosher food': 'kosher',
    keto: 'keto',
    'keto friendly': 'keto',
    'low carb': 'low-carb',
    'paleo': 'paleo',
    'nut free': 'nut-free',
    'allergy friendly': 'allergy-friendly'
  },

  // Restaurant features - expanded
  features: {
    'outdoor seating': 'outdoor-seating',
    'outside seating': 'outdoor-seating',
    patio: 'outdoor-seating',
    terrace: 'outdoor-seating',
    'outdoor dining': 'outdoor-seating',
    'sit outside': 'outdoor-seating',
    'eat outside': 'outdoor-seating',
    parking: 'parking',
    'free parking': 'parking',
    'has parking': 'parking',
    'parking available': 'parking',
    'valet': 'parking',
    delivery: 'delivery',
    'food delivery': 'delivery',
    'delivers': 'delivery',
    takeout: 'takeout',
    'take out': 'takeout',
    'to go': 'takeout',
    'pickup': 'takeout',
    'carry out': 'takeout',
    wifi: 'wifi',
    'free wifi': 'wifi',
    'wi-fi': 'wifi',
    'internet': 'wifi',
    'live music': 'live-music',
    'music': 'live-music',
    'entertainment': 'live-music',
    'band': 'live-music',
    bar: 'bar',
    'full bar': 'bar',
    'cocktails': 'bar',
    'drinks': 'bar',
    'serves alcohol': 'bar',
    'happy hour': 'happy-hour',
    'happy-hour': 'happy-hour',
    'drink specials': 'happy-hour',
    'reservations': 'reservations',
    'takes reservations': 'reservations',
    'can make reservation': 'reservations',
    'book a table': 'reservations',
    'wheelchair accessible': 'wheelchair-accessible',
    'accessible': 'wheelchair-accessible',
    'kid friendly': 'family-friendly',
    'child friendly': 'family-friendly',
    'kids menu': 'family-friendly',
    'children welcome': 'family-friendly'
  },

  // Ambiance - expanded
  ambiance: {
    casual: 'casual',
    'casual dining': 'casual',
    'laid back': 'casual',
    relaxed: 'casual',
    'fine dining': 'fine-dining',
    upscale: 'fine-dining',
    fancy: 'fine-dining',
    elegant: 'fine-dining',
    'high end': 'fine-dining',
    'family friendly': 'family-friendly',
    'good for families': 'family-friendly',
    'good for kids': 'family-friendly',
    romantic: 'romantic',
    'date night': 'romantic',
    intimate: 'romantic',
    'good for dates': 'romantic',
    quiet: 'quiet',
    peaceful: 'quiet',
    'not noisy': 'quiet',
    'can hear conversation': 'quiet',
    lively: 'lively',
    energetic: 'lively',
    vibrant: 'lively',
    'fun atmosphere': 'lively',
    trendy: 'trendy',
    hip: 'trendy',
    'cool vibe': 'trendy',
    modern: 'trendy',
    'sports bar': 'sports-bar',
    'watch sports': 'sports-bar',
    'watch the game': 'sports-bar',
    'big screen': 'sports-bar',
    'tvs': 'sports-bar',
    'rooftop': 'rooftop',
    'roof deck': 'rooftop',
    'view': 'rooftop',
    'scenic view': 'rooftop'
  },

  // Time/status keywords - expanded
  time: {
    'open now': true,
    'open late': true,
    'currently open': true,
    'still open': true,
    'open today': true,
    'open this evening': true,
    'open for lunch': true,
    'open for dinner': true,
    'open for breakfast': true,
    'open 24 hours': true,
    'open all night': true,
    'open right now': true
  },

  // Rating keywords - expanded
  rating: {
    'highly rated': 4.0,
    'good reviews': 3.5,
    'top rated': 4.5,
    'best': 4.5,
    'excellent': 4.5,
    'great reviews': 4.0,
    'well reviewed': 4.0,
    'popular': 3.5,
    'favorite': 4.0,
    'highly recommended': 4.5,
    'top notch': 4.5,
    'five star': 5.0,
    '5 star': 5.0,
    'four star': 4.0,
    '4 star': 4.0
  },

  // Conversational patterns
  conversational: {
    'i want': true,
    'i\'m looking for': true,
    'i\'d like': true,
    'can you find': true,
    'show me': true,
    'find me': true,
    'searching for': true,
    'in the mood for': true,
    'craving': true,
    'feel like': true,
    'looking to eat': true,
    'want to eat': true,
    'want to try': true,
    'want to find': true,
    'help me find': true
  },

  // Location context
  location: {
    'near me': 'nearby',
    'close by': 'nearby',
    'in this area': 'nearby',
    'nearby': 'nearby',
    'walking distance': 'walking',
    'within walking distance': 'walking',
    'downtown': 'downtown',
    'in downtown': 'downtown',
    'uptown': 'uptown',
    'in the city': 'city',
    'city center': 'downtown'
  },

  // Meal type context
  mealType: {
    'breakfast': 'breakfast',
    'brunch': 'brunch',
    'lunch': 'lunch',
    'dinner': 'dinner',
    'late night': 'late-night',
    'dessert': 'dessert',
    'coffee': 'coffee',
    'drinks': 'drinks'
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
  },
  {
    pattern: /i('m| am) in the mood for (.*)/i,
    handler: (match: string[]) => `You're in the mood for ${match[2]}`
  },
  {
    pattern: /i('m| am) craving (.*)/i,
    handler: (match: string[]) => `You're craving ${match[2]}`
  },
  {
    pattern: /i('d| would) like (.*)/i,
    handler: (match: string[]) => `You'd like ${match[2]}`
  },
  {
    pattern: /can you (find|show) (.*)/i,
    handler: (match: string[]) => `Looking for ${match[2]}`
  },
  {
    pattern: /i feel like (.*)/i,
    handler: (match: string[]) => `You feel like ${match[1]}`
  },
  {
    pattern: /help me find (.*)/i,
    handler: (match: string[]) => `Helping you find ${match[1]}`
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

  // Extract location context
  const locationContext = extractLocationContext(normalizedQuery);
  if (locationContext) {
    // For now, we don't add this as a filter, but we could use it to adjust search radius
    // or add a custom location filter in the future
    confidence += 0.1;
    interpretedParts.push(`location: ${locationContext}`);
  }

  // Extract meal type context
  const mealTypeContext = extractMealTypeContext(normalizedQuery);
  if (mealTypeContext) {
    // Emit mealType filter for matching cards
    filters.push({
      filterId: 'mealType',
      value: [mealTypeContext]
    });
    confidence += 0.1;
    interpretedParts.push(`meal: ${mealTypeContext}`);
  }

  // Check for negation patterns
  const negationResult = checkForNegation(normalizedQuery);
  if (negationResult.hasNegation) {
    // Adjust confidence if negation is detected
    confidence -= 0.1;

    // Add note about negation to interpretation
    if (negationResult.negatedTerms.length > 0) {
      interpretedParts.push(`excluding: ${negationResult.negatedTerms.join(', ')}`);
    }
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
 * Extract location context from query
 */
function extractLocationContext(query: string): string | null {
  for (const [keyword, value] of Object.entries(KEYWORD_MAPPINGS.location)) {
    if (query.includes(keyword)) {
      return value as string;
    }
  }
  return null;
}

/**
 * Extract meal type context from query
 */
function extractMealTypeContext(query: string): string | null {
  for (const [keyword, value] of Object.entries(KEYWORD_MAPPINGS.mealType)) {
    if (query.includes(keyword)) {
      return value as string;
    }
  }
  return null;
}

/**
 * Check for negation patterns in the query
 */
function checkForNegation(query: string): { hasNegation: boolean; negatedTerms: string[] } {
  const negationPatterns = [
    /no (.*?)(?=\s|$)/g,
    /not (.*?)(?=\s|$)/g,
    /don't want (.*?)(?=\s|$)/g,
    /don't like (.*?)(?=\s|$)/g,
    /without (.*?)(?=\s|$)/g,
    /except (.*?)(?=\s|$)/g
  ];

  const negatedTerms: string[] = [];
  let hasNegation = false;

  for (const pattern of negationPatterns) {
    const matches = Array.from(query.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        hasNegation = true;
        negatedTerms.push(match[1].trim());
      }
    }
  }

  return { hasNegation, negatedTerms };
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
export function testNLP(query: string): NLPResult {
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
