// SIMPLIFIED RESTAURANT FILTERING SYSTEM
// Single file with all filter logic - easy to understand and maintain

import { useState, useEffect, useCallback, useRef } from 'react';
import { RestaurantCard } from '@/types/Types';

// ============================================================================
// UNIFIED TYPES - Single source of truth
// ============================================================================

export type FilterValue = string | number | boolean | string[];

export interface Filter {
  id: string;
  value: FilterValue;
  enabled: boolean;
}

export interface FilterDefinition {
  id: string;
  name: string;
  description?: string;
  type: 'boolean' | 'range' | 'select' | 'multiselect' | 'keyword';
  category: 'basic' | 'advanced';
  defaultValue?: FilterValue;
  options?: Array<{ value: string | number; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  icon?: string;
}

export interface FilterResult {
  filteredCards: RestaurantCard[];
  totalCount: number;
  appliedFilters: Filter[];
  processingTime: number;
}

// ============================================================================
// FILTER DEFINITIONS - All available filters in one place
// ============================================================================

export const FILTER_DEFINITIONS: FilterDefinition[] = [
  // Basic Filters
  {
    id: 'openNow',
    name: 'Open Now',
    description: 'Show only restaurants that are currently open',
    type: 'boolean',
    category: 'basic',
    defaultValue: false,
    icon: '🕐'
  },
  {
    id: 'minRating',
    name: 'Minimum Rating',
    description: 'Filter by minimum star rating',
    type: 'range',
    category: 'basic',
    min: 1,
    max: 5,
    step: 0.5,
    unit: 'stars',
    defaultValue: 3.0,
    icon: '⭐'
  },
  {
    id: 'priceLevel',
    name: 'Price Range',
    description: 'Filter by price level',
    type: 'select',
    category: 'basic',
    options: [
      { value: 1, label: '$ - Inexpensive' },
      { value: 2, label: '$$ - Moderate' },
      { value: 3, label: '$$$ - Expensive' },
      { value: 4, label: '$$$$ - Very Expensive' }
    ],
    icon: '💰'
  },
  {
    id: 'cuisine',
    name: 'Cuisine Type',
    description: 'Filter by type of cuisine',
    type: 'multiselect',
    category: 'basic',
    options: [
      { value: 'italian', label: 'Italian' },
      { value: 'chinese', label: 'Chinese' },
      { value: 'mexican', label: 'Mexican' },
      { value: 'indian', label: 'Indian' },
      { value: 'japanese', label: 'Japanese' },
      { value: 'american', label: 'American' },
      { value: 'thai', label: 'Thai' },
      { value: 'french', label: 'French' }
    ],
    icon: '🍽️'
  },
  // Advanced Filters
  {
    id: 'keyword',
    name: 'Search Keywords',
    description: 'Search for specific dishes or restaurant names',
    type: 'keyword',
    category: 'advanced',
    placeholder: 'e.g., pizza, sushi, burger',
    icon: '🔍'
  },
  {
    id: 'distance',
    name: 'Maximum Distance',
    description: 'Filter by distance from your location',
    type: 'range',
    category: 'advanced',
    min: 0.5,
    max: 25,
    step: 0.5,
    unit: 'km',
    defaultValue: 5,
    icon: '📍'
  },
  {
    id: 'dietaryRestrictions',
    name: 'Dietary Restrictions',
    description: 'Filter by dietary preferences and restrictions',
    type: 'multiselect',
    category: 'advanced',
    options: [
      { value: 'vegetarian', label: 'Vegetarian' },
      { value: 'vegan', label: 'Vegan' },
      { value: 'gluten-free', label: 'Gluten-Free' },
      { value: 'dairy-free', label: 'Dairy-Free' },
      { value: 'nut-free', label: 'Nut-Free' },
      { value: 'halal', label: 'Halal' },
      { value: 'kosher', label: 'Kosher' },
      { value: 'keto', label: 'Keto-Friendly' },
      { value: 'low-carb', label: 'Low-Carb' }
    ],
    icon: '🥗'
  },
  {
    id: 'restaurantFeatures',
    name: 'Restaurant Features',
    description: 'Filter by available amenities and services',
    type: 'multiselect',
    category: 'advanced',
    options: [
      { value: 'outdoor-seating', label: 'Outdoor Seating' },
      { value: 'parking', label: 'Parking Available' },
      { value: 'delivery', label: 'Delivery' },
      { value: 'takeout', label: 'Takeout' },
      { value: 'reservations', label: 'Accepts Reservations' },
      { value: 'wifi', label: 'Free WiFi' },
      { value: 'wheelchair-accessible', label: 'Wheelchair Accessible' },
      { value: 'live-music', label: 'Live Music' },
      { value: 'bar', label: 'Full Bar' },
      { value: 'happy-hour', label: 'Happy Hour' }
    ],
    icon: '🏪'
  },
  {
    id: 'ambiance',
    name: 'Ambiance',
    description: 'Filter by restaurant atmosphere and style',
    type: 'multiselect',
    category: 'advanced',
    options: [
      { value: 'casual', label: 'Casual Dining' },
      { value: 'fine-dining', label: 'Fine Dining' },
      { value: 'family-friendly', label: 'Family-Friendly' },
      { value: 'romantic', label: 'Romantic' },
      { value: 'business', label: 'Business Dining' },
      { value: 'trendy', label: 'Trendy/Hip' },
      { value: 'quiet', label: 'Quiet/Intimate' },
      { value: 'lively', label: 'Lively/Energetic' },
      { value: 'sports-bar', label: 'Sports Bar' },
      { value: 'rooftop', label: 'Rooftop/Scenic' }
    ],
    icon: '🎭'
  }
];

// ============================================================================
// FILTER ENGINE - All logic in one place
// ============================================================================

class FilterEngine {
  // Apply all active filters to cards
  static async applyFilters(cards: RestaurantCard[], filters: Filter[]): Promise<FilterResult> {
    const startTime = Date.now();
    const activeFilters = filters.filter(f => f.enabled);

    if (activeFilters.length === 0) {
      return {
        filteredCards: cards,
        totalCount: cards.length,
        appliedFilters: [],
        processingTime: Date.now() - startTime
      };
    }

    let filteredCards = [...cards];

    // Apply each filter
    for (const filter of activeFilters) {
      filteredCards = this.applyFilter(filteredCards, filter);
    }

    return {
      filteredCards,
      totalCount: filteredCards.length,
      appliedFilters: activeFilters,
      processingTime: Date.now() - startTime
    };
  }

  // Apply a single filter to cards
  private static applyFilter(cards: RestaurantCard[], filter: Filter): RestaurantCard[] {
    const definition = FILTER_DEFINITIONS.find(d => d.id === filter.id);
    if (!definition) return cards;

    switch (filter.id) {
      case 'openNow':
        return filter.value ? cards.filter(card => card.isOpenNow === true) : cards;

      case 'minRating':
        return cards.filter(card => (card.rating || 0) >= Number(filter.value));

      case 'priceLevel':
        // Map numeric selection (1-4) to RestaurantCard.priceRange ('$'..'$$$$')
        const levelToSymbol: Record<number, '$' | '$$' | '$$$' | '$$$$'> = {
          1: '$',
          2: '$$',
          3: '$$$',
          4: '$$$$',
        };
        return cards.filter(card => card.priceRange === levelToSymbol[Number(filter.value)]);

      case 'cuisine':
        const cuisines = Array.isArray(filter.value) ? filter.value : [filter.value];
        console.log('Filtering by cuisines:', cuisines);

        return cards.filter(card => {
          // Check multiple possible sources for cuisine information
          const cardTypes = card.types || [];
          const cardTitle = card.title || '';
          const cardDescription = card.description || '';
          const cardCuisine = card.cuisine || '';

          const matchResult = cuisines.some(cuisine => {
            const cuisineLower = String(cuisine).toLowerCase();

            // Check if any of the card's types match the cuisine
            const typeMatch = cardTypes.some((type: string) =>
              type.toLowerCase().includes(cuisineLower) ||
              cuisineLower.includes(type.toLowerCase())
            );

            // Check title and description for cuisine keywords
            const titleMatch = cardTitle.toLowerCase().includes(cuisineLower);
            const descriptionMatch = cardDescription.toLowerCase().includes(cuisineLower);
            const cuisineMatch = cardCuisine.toLowerCase().includes(cuisineLower);

            // Also check for common cuisine keywords
            const cuisineKeywords: Record<string, string[]> = {
              'italian': ['pizza', 'pasta', 'italian', 'pizzeria', 'trattoria', 'ristorante', 'gelato', 'espresso'],
              'chinese': ['chinese', 'asian', 'noodle', 'dim sum', 'wok', 'szechuan', 'cantonese', 'mandarin'],
              'mexican': ['mexican', 'taco', 'burrito', 'quesadilla', 'tex-mex', 'enchilada', 'fajita', 'salsa'],
              'indian': ['indian', 'curry', 'tandoor', 'biryani', 'masala', 'naan', 'tikka', 'vindaloo'],
              'japanese': ['japanese', 'sushi', 'ramen', 'hibachi', 'teriyaki', 'tempura', 'yakitori', 'miso'],
              'american': ['american', 'burger', 'bbq', 'grill', 'diner', 'steakhouse', 'sandwich', 'wings'],
              'thai': ['thai', 'pad thai', 'curry', 'asian', 'tom yum', 'green curry', 'coconut'],
              'french': ['french', 'bistro', 'cafe', 'brasserie', 'croissant', 'crepe', 'escargot']
            };

            const keywords = cuisineKeywords[cuisineLower] || [cuisineLower];
            const keywordMatch = keywords.some((keyword: string) =>
              cardTitle.toLowerCase().includes(keyword) ||
              cardDescription.toLowerCase().includes(keyword) ||
              cardTypes.some((type: string) => type.toLowerCase().includes(keyword))
            );

            return typeMatch || titleMatch || descriptionMatch || cuisineMatch || keywordMatch;
          });

          if (matchResult) {
            console.log(`Card "${card.title}" matched cuisine filter:`, {
              types: cardTypes,
              title: cardTitle,
              description: cardDescription
            });
          }

          return matchResult;
        });

      case 'keyword':
        const keyword = String(filter.value).toLowerCase();
        return cards.filter(card =>
          card.title.toLowerCase().includes(keyword) ||
          card.description?.toLowerCase().includes(keyword) ||
          card.types?.some((type: string) => type.toLowerCase().includes(keyword))
        );

      case 'distance':
        // Convert filter value from kilometers to meters for comparison
        const maxDistanceKm = Number(filter.value);
        const maxDistanceMeters = maxDistanceKm * 1000;
        return cards.filter(card => {
          // Use distanceInMeters for accurate comparison
          const cardDistanceMeters = card.distanceInMeters || 0;
          return cardDistanceMeters <= maxDistanceMeters;
        });

      case 'dietaryRestrictions':
        const dietaryRestrictions = Array.isArray(filter.value) ? filter.value : [filter.value];
        return cards.filter(card => {
          // Check if the restaurant supports the dietary restrictions
          // This would typically come from restaurant data, but for now we'll use keywords
          const cardText = `${card.title} ${card.description || ''} ${card.types?.join(' ') || ''}`.toLowerCase();

          return dietaryRestrictions.some(restriction => {
            const restrictionLower = String(restriction).toLowerCase();

            // Define keywords for each dietary restriction
            const dietaryKeywords: Record<string, string[]> = {
              'vegetarian': ['vegetarian', 'veggie', 'plant-based', 'meat-free'],
              'vegan': ['vegan', 'plant-based', 'dairy-free'],
              'gluten-free': ['gluten-free', 'gluten free', 'celiac', 'gf'],
              'dairy-free': ['dairy-free', 'dairy free', 'lactose-free', 'non-dairy'],
              'nut-free': ['nut-free', 'nut free', 'allergy-friendly'],
              'halal': ['halal', 'islamic', 'muslim'],
              'kosher': ['kosher', 'jewish', 'orthodox'],
              'keto': ['keto', 'ketogenic', 'low-carb', 'high-fat'],
              'low-carb': ['low-carb', 'low carb', 'keto', 'atkins']
            };

            const keywords = dietaryKeywords[restrictionLower] || [restrictionLower];
            return keywords.some(keyword => cardText.includes(keyword));
          });
        });

      case 'restaurantFeatures':
        const features = Array.isArray(filter.value) ? filter.value : [filter.value];
        return cards.filter(card => {
          // Check if the restaurant has the required features
          const cardText = `${card.title} ${card.description || ''} ${card.types?.join(' ') || ''}`.toLowerCase();

          return features.some(feature => {
            const featureLower = String(feature).toLowerCase();

            // Define keywords for each feature
            const featureKeywords: Record<string, string[]> = {
              'outdoor-seating': ['outdoor', 'patio', 'terrace', 'garden', 'sidewalk', 'al fresco'],
              'parking': ['parking', 'valet', 'garage', 'lot'],
              'delivery': ['delivery', 'delivers', 'door dash', 'uber eats', 'grubhub'],
              'takeout': ['takeout', 'take out', 'to go', 'pickup', 'carry out'],
              'reservations': ['reservations', 'booking', 'table', 'reserve'],
              'wifi': ['wifi', 'wi-fi', 'internet', 'wireless'],
              'wheelchair-accessible': ['wheelchair', 'accessible', 'ada', 'handicap'],
              'live-music': ['live music', 'band', 'entertainment', 'acoustic'],
              'bar': ['bar', 'cocktails', 'drinks', 'alcohol', 'wine', 'beer'],
              'happy-hour': ['happy hour', 'happy-hour', 'specials', 'discounts']
            };

            const keywords = featureKeywords[featureLower] || [featureLower];
            return keywords.some(keyword => cardText.includes(keyword));
          });
        });

      case 'ambiance':
        const ambianceTypes = Array.isArray(filter.value) ? filter.value : [filter.value];
        return cards.filter(card => {
          // Check if the restaurant matches the ambiance
          const cardText = `${card.title} ${card.description || ''} ${card.types?.join(' ') || ''}`.toLowerCase();

          return ambianceTypes.some(ambiance => {
            const ambianceLower = String(ambiance).toLowerCase();

            // Define keywords for each ambiance type
            const ambianceKeywords: Record<string, string[]> = {
              'casual': ['casual', 'relaxed', 'informal', 'laid-back', 'family'],
              'fine-dining': ['fine dining', 'upscale', 'elegant', 'sophisticated', 'gourmet', 'michelin'],
              'family-friendly': ['family', 'kids', 'children', 'playground', 'kid-friendly'],
              'romantic': ['romantic', 'intimate', 'date', 'candlelit', 'cozy'],
              'business': ['business', 'corporate', 'meeting', 'professional', 'lunch'],
              'trendy': ['trendy', 'hip', 'modern', 'contemporary', 'stylish', 'chic'],
              'quiet': ['quiet', 'peaceful', 'intimate', 'serene', 'calm'],
              'lively': ['lively', 'energetic', 'vibrant', 'bustling', 'loud', 'party'],
              'sports-bar': ['sports', 'bar', 'game', 'tv', 'screen', 'pub'],
              'rooftop': ['rooftop', 'scenic', 'view', 'skyline', 'terrace', 'panoramic']
            };

            const keywords = ambianceKeywords[ambianceLower] || [ambianceLower];
            return keywords.some(keyword => cardText.includes(keyword));
          });
        });

      default:
        return cards;
    }
  }
}

// ============================================================================
// SIMPLIFIED HOOK INTERFACE
// ============================================================================

interface UseFiltersOptions {
  enablePersistence?: boolean;
  storageKey?: string;
  onNewFiltersApplied?: () => void;
}

interface UseFiltersReturn {
  // State
  filters: Filter[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addFilter: (filterId: string, value: FilterValue) => void;
  updateFilter: (filterId: string, value: FilterValue) => void;
  removeFilter: (filterId: string) => void;
  clearFilters: () => void;
  applyFilters: (cards: RestaurantCard[]) => Promise<FilterResult>;
  onNewFiltersApplied: () => void;

  // Utilities
  getFilterValue: (filterId: string) => FilterValue | undefined;
  getFilterDefinition: (filterId: string) => FilterDefinition | undefined;
  getFiltersByCategory: () => { basic: FilterDefinition[]; advanced: FilterDefinition[] };
}

// ============================================================================
// MAIN HOOK 
// ============================================================================

export function useFilters(options: UseFiltersOptions = {}): UseFiltersReturn {
  const {
    enablePersistence = true,
    storageKey = 'restaurant-filters',
    onNewFiltersApplied: onNewFiltersAppliedCallback
  } = options;

  // Simple state
  const [filters, setFilters] = useState<Filter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track current filters for stable access
  const filtersRef = useRef<Filter[]>([]);

  // Load persisted filters on mount
  useEffect(() => {
    if (enablePersistence) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Ensure parsed data is an array
          if (Array.isArray(parsed)) {
            setFilters(parsed);
          } else {
            console.warn('Invalid filter data in localStorage, resetting to empty array');
            setFilters([]);
          }
        }
      } catch (err) {
        console.warn('Failed to load filters:', err);
        setFilters([]);
      }
    }
  }, [enablePersistence, storageKey]);

  // Persist filters when they change (including empty clears)
  useEffect(() => {
    if (!enablePersistence) return;
    try {
      if (Array.isArray(filters)) {
        // Persist current snapshot, even when empty, so clears stick across reloads
        localStorage.setItem(storageKey, JSON.stringify(filters));
      } else {
        // Fallback: remove invalid state
        localStorage.removeItem(storageKey);
      }
    } catch (err) {
      console.warn('Failed to persist filters:', err);
    }
  }, [filters, enablePersistence, storageKey]);

  // Update ref when filters change
  useEffect(() => {
    filtersRef.current = Array.isArray(filters) ? filters : [];
  }, [filters]);

  // Computed values
  const currentFilters = Array.isArray(filters) ? filters : [];

  // Actions
  const addFilter = useCallback((filterId: string, value: FilterValue) => {
    setFilters(prev => {
      // Ensure prev is always an array
      const currentFilters = Array.isArray(prev) ? prev : [];
      const existing = currentFilters.find(f => f.id === filterId);
      if (existing) {
        // Only update if the value actually changed
        if (existing.value === value && existing.enabled === true) {
          return currentFilters; // No change needed
        }
        return currentFilters.map(f => f.id === filterId ? { ...f, value, enabled: true } : f);
      }
      return [...currentFilters, { id: filterId, value, enabled: true }];
    });
    setError(null);
  }, []);

  const updateFilter = useCallback((filterId: string, value: FilterValue) => {
    setFilters(prev => {
      // Ensure prev is always an array
      const currentFilters = Array.isArray(prev) ? prev : [];
      const existing = currentFilters.find(f => f.id === filterId);
      // Only update if the value actually changed
      if (existing && existing.value === value) {
        return currentFilters; // No change needed
      }
      return currentFilters.map(f => f.id === filterId ? { ...f, value } : f);
    });
  }, []);

  const removeFilter = useCallback((filterId: string) => {
    setFilters(prev => {
      // Ensure prev is always an array
      const currentFilters = Array.isArray(prev) ? prev : [];
      return currentFilters.filter(f => f.id !== filterId);
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(prev => {
      // Only clear if there are actually filters to clear
      if (!Array.isArray(prev) || prev.length === 0) {
        return prev; // No change needed
      }
      return [];
    });
    setError(null);
    // Ensure persistence clears immediately
    try {
      localStorage.setItem(storageKey, JSON.stringify([]));
    } catch {}
    // Proactively notify the consumer to re-filter immediately
    try {
      setTimeout(() => {
        if (onNewFiltersAppliedCallback) {
          onNewFiltersAppliedCallback();
        }
      }, 0);
    } catch {}
  }, []);

  const applyFilters = useCallback(async (cards: RestaurantCard[]): Promise<FilterResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the ref to get current filters without causing dependency issues
      const currentFilters = filtersRef.current;
      const result = await FilterEngine.applyFilters(cards, currentFilters);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Filter application failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onNewFiltersApplied = useCallback(() => {
    console.log('New filters applied, triggering re-filter...');
    if (onNewFiltersAppliedCallback) {
      // Use setTimeout to avoid potential synchronous state update issues
      setTimeout(() => {
        onNewFiltersAppliedCallback();
      }, 0);
    }
  }, [onNewFiltersAppliedCallback]);

  // Utilities
  const getFilterValue = useCallback((filterId: string): FilterValue | undefined => {
    // Ensure filters is always an array
    const currentFilters = Array.isArray(filters) ? filters : [];
    return currentFilters.find(f => f.id === filterId)?.value;
  }, [filters]);

  const getFilterDefinition = useCallback((filterId: string): FilterDefinition | undefined => {
    return FILTER_DEFINITIONS.find(d => d.id === filterId);
  }, []);

  const getFiltersByCategory = useCallback(() => {
    return {
      basic: FILTER_DEFINITIONS.filter(d => d.category === 'basic'),
      advanced: FILTER_DEFINITIONS.filter(d => d.category === 'advanced')
    };
  }, []);

  return {
    // State
    filters: currentFilters,
    isLoading,
    error,

    // Actions
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    applyFilters,
    onNewFiltersApplied,

    // Utilities
    getFilterValue,
    getFilterDefinition,
    getFiltersByCategory
  };
}
