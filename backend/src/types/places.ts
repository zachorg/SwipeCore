import { z } from 'zod';

// Request validation schemas
export const nearbySearchSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().min(1).max(50000).optional().default(1500),
  keyword: z.string().optional(),
  type: z.string().optional(),
});

export const placeIdSchema = z.object({
  placeId: z.string().min(1),
});

export const photoReferenceSchema = z.object({
  photoReference: z.string().min(1),
  maxWidth: z.number().min(1).max(4800).optional().default(400),
  maxHeight: z.number().min(1).max(4800).optional().default(400),
});

// Type definitions based on Google Places API (New)
export interface PlaceBasic {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress?: string;
  rating?: number;
  priceLevel?: 'PRICE_LEVEL_FREE' | 'PRICE_LEVEL_INEXPENSIVE' | 'PRICE_LEVEL_MODERATE' | 'PRICE_LEVEL_EXPENSIVE' | 'PRICE_LEVEL_VERY_EXPENSIVE';
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions: Array<{
      displayName: string;
      uri: string;
      photoUri: string;
    }>;
  }>;
  types?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface PlaceDetails extends PlaceBasic {
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    openNow: boolean;
    periods: Array<{
      open: {
        day: number;
        hour: number;
        minute: number;
      };
      close?: {
        day: number;
        hour: number;
        minute: number;
      };
    }>;
    weekdayDescriptions: string[];
  };
  reviews?: Array<{
    name: string;
    relativePublishTimeDescription: string;
    rating: number;
    text: {
      text: string;
      languageCode: string;
    };
    originalText: {
      text: string;
      languageCode: string;
    };
    authorAttribution: {
      displayName: string;
      uri: string;
      photoUri: string;
    };
  }>;
  editorialSummary?: {
    text: string;
    languageCode: string;
  };
}

export type NearbySearchParams = z.infer<typeof nearbySearchSchema>;