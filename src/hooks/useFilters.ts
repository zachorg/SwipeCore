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
    name: '',
    description: 'Minimum Rating',
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
    name: '',
    description: 'Price Range',
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
    description: 'Cuisine Type',
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
    name: '',
    description: 'Search for specific dishes or restaurant names',
    type: 'keyword',
    category: 'advanced',
    placeholder: 'e.g., pizza, sushi, burger',
    icon: '🔍'
  },
  {
    id: 'distance',
    name: '',
    description: 'Maximum distance from your location',
    type: 'range',
    category: 'advanced',
    min: 0.5,
    max: 25,
    step: 0.5,
    unit: 'km',
    defaultValue: 5,
    icon: '📍'
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
        return filter.value ? cards.filter(card => card.isOpen) : cards;

      case 'minRating':
        return cards.filter(card => (card.rating || 0) >= Number(filter.value));

      case 'priceLevel':
        return cards.filter(card => card.priceLevel === Number(filter.value));

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

  // Persist filters when they change
  useEffect(() => {
    if (enablePersistence && Array.isArray(filters) && filters.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(filters));
      } catch (err) {
        console.warn('Failed to persist filters:', err);
      }
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
