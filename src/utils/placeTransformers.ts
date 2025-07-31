import { 
  PlaceBasic, 
  PlaceDetails, 
  RestaurantCard, 
  AppReview, 
  PlaceTransformOptions 
} from '../types/places';
import { calculateDistance } from '../services/places';

/**
 * Transform Google Places price level to app price range format
 */
export const transformPriceLevel = (priceLevel?: string): '$' | '$$' | '$$$' | '$$$$' | undefined => {
  if (!priceLevel) return undefined;
  
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
      return '$';
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$';
    case 'PRICE_LEVEL_MODERATE':
      return '$$';
    case 'PRICE_LEVEL_EXPENSIVE':
      return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$$';
    default:
      return undefined;
  }
};

/**
 * Extract cuisine type from Google Places types array
 */
export const extractCuisineType = (types?: string[]): string | undefined => {
  if (!types) return undefined;
  
  // Mapping of Google Places types to cuisine types
  const cuisineMap: Record<string, string> = {
    'italian_restaurant': 'Italian',
    'japanese_restaurant': 'Japanese',
    'chinese_restaurant': 'Chinese',
    'mexican_restaurant': 'Mexican',
    'thai_restaurant': 'Thai',
    'indian_restaurant': 'Indian',
    'french_restaurant': 'French',
    'american_restaurant': 'American',
    'mediterranean_restaurant': 'Mediterranean',
    'pizza_restaurant': 'Pizza',
    'seafood_restaurant': 'Seafood',
    'steakhouse': 'Steakhouse',
    'sushi_restaurant': 'Sushi',
    'fast_food_restaurant': 'Fast Food',
    'cafe': 'Cafe',
    'bakery': 'Bakery',
    'bar': 'Bar',
    'restaurant': 'Restaurant'
  };
  
  // Find the first matching cuisine type
  for (const type of types) {
    const cuisine = cuisineMap[type.toLowerCase()];
    if (cuisine) return cuisine;
  }
  
  // Fallback to 'Restaurant' if no specific cuisine type found
  return types.includes('restaurant') ? 'Restaurant' : undefined;
};

/**
 * Format opening hours for display
 */
export const formatOpeningHours = (hours?: PlaceDetails['regularOpeningHours']): {
  displayText: string;
  isOpenNow: boolean;
} => {
  if (!hours) {
    return { displayText: 'Hours not available', isOpenNow: false };
  }
  
  if (hours.openNow) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Find today's periods
    const todayPeriods = hours.periods?.filter(period => period.open.day === currentDay) || [];
    
    if (todayPeriods.length > 0) {
      const period = todayPeriods[0];
      if (period.close) {
        const closeHour = period.close.hour;
        const closeMinute = period.close.minute;
        const closeTime = formatTime(closeHour, closeMinute);
        return { 
          displayText: `Open now · Closes ${closeTime}`, 
          isOpenNow: true 
        };
      } else {
        return { 
          displayText: 'Open 24 hours', 
          isOpenNow: true 
        };
      }
    }
  }
  
  return { displayText: 'Closed', isOpenNow: false };
};

/**
 * Format time for display (24h to 12h format)
 */
const formatTime = (hour: number, minute: number): string => {
  const displayHour = hour > 12 ? hour - 12 : hour || 12;
  const minuteStr = minute.toString().padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minuteStr} ${period}`;
};

/**
 * Transform Google Places reviews to app review format
 */
export const transformReviews = (reviews?: PlaceDetails['reviews']): AppReview[] => {
  if (!reviews) return [];
  
  return reviews.slice(0, 5).map((review, index) => ({
    id: review.name || `review-${index}`,
    author: review.authorAttribution.displayName,
    rating: review.rating,
    comment: review.text.text,
    date: new Date().toISOString().split('T')[0], // Fallback date
    relativeTime: review.relativePublishTimeDescription,
  }));
};

/**
 * Get the first photo URL or return null
 */
export const getFirstPhotoReference = (photos?: PlaceBasic['photos']): string | null => {
  if (!photos || photos.length === 0) return null;
  return photos[0].name;
};

/**
 * Transform all photo references to an array of photo names
 */
export const transformPhotos = (photos?: PlaceBasic['photos']): {
  photoUrls: string[];
  photoReferences: Array<{ name: string; widthPx: number; heightPx: number; }>;
} => {
  if (!photos) {
    return { photoUrls: [], photoReferences: [] };
  }
  
  const photoReferences = photos.map(photo => ({
    name: photo.name,
    widthPx: photo.widthPx,
    heightPx: photo.heightPx,
  }));
  
  // For now, we'll store the photo references as URLs
  // In a real implementation, you'd call the photo API to get actual URLs
  const photoUrls = photos.map(photo => photo.name);
  
  return { photoUrls, photoReferences };
};

/**
 * Calculate distance between user location and place
 */
export const calculateDistanceFromUser = (
  place: PlaceBasic,
  userLatitude?: number,
  userLongitude?: number
): { distance: string; distanceInMeters: number } => {
  if (!place.location || !userLatitude || !userLongitude) {
    return { distance: '', distanceInMeters: 0 };
  }
  
  const distanceStr = calculateDistance(
    userLatitude,
    userLongitude,
    place.location.latitude,
    place.location.longitude
  );
  
  // Extract numeric value and convert to meters
  const distanceInMeters = parseFloat(distanceStr) * (distanceStr.includes('km') ? 1000 : 1);
  
  return { distance: distanceStr, distanceInMeters };
};

/**
 * Transform a PlaceBasic to RestaurantCard
 */
export const transformPlaceBasicToCard = (
  place: PlaceBasic,
  options: PlaceTransformOptions = {}
): RestaurantCard => {
  const { userLatitude, userLongitude, defaultImageUrl } = options;
  
  const cuisine = extractCuisineType(place.types);
  const priceRange = transformPriceLevel(place.priceLevel);
  const { distance, distanceInMeters } = calculateDistanceFromUser(place, userLatitude, userLongitude);
  const firstPhotoRef = getFirstPhotoReference(place.photos);
  const { photoUrls, photoReferences } = transformPhotos(place.photos);
  
  return {
    id: place.id,
    imageUrl: firstPhotoRef || defaultImageUrl || null,
    title: place.displayName.text,
    subtitle: cuisine,
    cuisine,
    rating: place.rating,
    priceRange,
    distance,
    distanceInMeters,
    address: place.formattedAddress,
    photos: photoUrls,
    photoReferences,
    location: place.location,
    reviews: [], // Will be populated when details are loaded
  };
};

/**
 * Transform a PlaceDetails to RestaurantCard (with full details)
 */
export const transformPlaceDetailsToCard = (
  placeDetails: PlaceDetails,
  options: PlaceTransformOptions = {}
): RestaurantCard => {
  const { userLatitude, userLongitude, defaultImageUrl } = options;
  
  const basicCard = transformPlaceBasicToCard(placeDetails, options);
  const openingHours = formatOpeningHours(placeDetails.regularOpeningHours);
  const reviews = transformReviews(placeDetails.reviews);
  
  return {
    ...basicCard,
    phone: placeDetails.nationalPhoneNumber || placeDetails.internationalPhoneNumber,
    website: placeDetails.websiteUri,
    openingHours: openingHours.displayText,
    isOpenNow: openingHours.isOpenNow,
    reviews,
    placeDetails, // Store raw details for advanced features
  };
};

/**
 * Transform an array of PlaceBasic to RestaurantCard array
 */
export const transformPlacesToCards = (
  places: PlaceBasic[],
  options: PlaceTransformOptions = {}
): RestaurantCard[] => {
  return places.map(place => transformPlaceBasicToCard(place, options));
};

/**
 * Merge basic card with detailed information
 */
export const mergeCardWithDetails = (
  basicCard: RestaurantCard,
  placeDetails: PlaceDetails,
  options: PlaceTransformOptions = {}
): RestaurantCard => {
  const detailedCard = transformPlaceDetailsToCard(placeDetails, options);
  
  return {
    ...basicCard,
    ...detailedCard,
    // Keep the original image URL if it was already loaded
    imageUrl: basicCard.imageUrl || detailedCard.imageUrl,
  };
};

/**
 * Filter cards based on user preferences
 */
export const filterCardsByPreferences = (
  cards: RestaurantCard[],
  preferences: {
    maxDistance?: number; // in meters
    minRating?: number;
    priceRanges?: Array<'$' | '$$' | '$$$' | '$$$$'>;
    cuisines?: string[];
    onlyOpenNow?: boolean;
  }
): RestaurantCard[] => {
  return cards.filter(card => {
    // Distance filter
    if (preferences.maxDistance && card.distanceInMeters && card.distanceInMeters > preferences.maxDistance) {
      return false;
    }
    
    // Rating filter
    if (preferences.minRating && card.rating && card.rating < preferences.minRating) {
      return false;
    }
    
    // Price range filter
    if (preferences.priceRanges && preferences.priceRanges.length > 0 && card.priceRange) {
      if (!preferences.priceRanges.includes(card.priceRange)) {
        return false;
      }
    }
    
    // Cuisine filter
    if (preferences.cuisines && preferences.cuisines.length > 0 && card.cuisine) {
      if (!preferences.cuisines.includes(card.cuisine)) {
        return false;
      }
    }
    
    // Open now filter
    if (preferences.onlyOpenNow && card.isOpenNow === false) {
      return false;
    }
    
    return true;
  });
};

/**
 * Sort cards by various criteria
 */
export const sortCards = (
  cards: RestaurantCard[],
  sortBy: 'distance' | 'rating' | 'priceAsc' | 'priceDesc' = 'distance'
): RestaurantCard[] => {
  const sortedCards = [...cards];
  
  switch (sortBy) {
    case 'distance':
      return sortedCards.sort((a, b) => {
        const aDistance = a.distanceInMeters || Infinity;
        const bDistance = b.distanceInMeters || Infinity;
        return aDistance - bDistance;
      });
      
    case 'rating':
      return sortedCards.sort((a, b) => {
        const aRating = a.rating || 0;
        const bRating = b.rating || 0;
        return bRating - aRating; // Descending
      });
      
    case 'priceAsc':
      return sortedCards.sort((a, b) => {
        const priceOrder = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
        const aPrice = priceOrder[a.priceRange as keyof typeof priceOrder] || 0;
        const bPrice = priceOrder[b.priceRange as keyof typeof priceOrder] || 0;
        return aPrice - bPrice;
      });
      
    case 'priceDesc':
      return sortedCards.sort((a, b) => {
        const priceOrder = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
        const aPrice = priceOrder[a.priceRange as keyof typeof priceOrder] || 0;
        const bPrice = priceOrder[b.priceRange as keyof typeof priceOrder] || 0;
        return bPrice - aPrice;
      });
      
    default:
      return sortedCards;
  }
};

/**
 * Get a default/fallback image URL for restaurants without photos
 */
export const getDefaultRestaurantImage = (cuisine?: string): string => {
  const defaults: Record<string, string> = {
    'Italian': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=600&fit=crop',
    'Japanese': 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=600&fit=crop',
    'Mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=600&fit=crop',
    'American': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=600&fit=crop',
    'Thai': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=600&fit=crop',
  };
  
  return defaults[cuisine || ''] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=600&fit=crop';
};