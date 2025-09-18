import axios from 'axios';
import { withCache } from '../cache';
import { nearbyKey, detailsKey, textSearchKey } from './key';
import { config } from '../config';
import { NearbySearchParams, TextSearchParams } from '../types/places';

const base = 'https://places.googleapis.com/v1';

export async function nearby(p: NearbySearchParams) {
  return withCache(nearbyKey(p), config.cacheTtlDays * 86400, async () => {
    const requestBody = {
      includedTypes: p.type ? [p.type] : undefined,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: p.lat,
            longitude: p.lng,
          },
          radius: p.radius,
        },
      },
      languageCode: 'en',
    };

    const response = await axios.post(
      `${base}/places:searchNearby`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': config.googlePlacesApiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos,places.types,places.location,places.regularOpeningHours.openNow',
        },
      }
    );

    return response.data;
  });
}

export async function details(id: string) {
  return withCache(detailsKey(id), config.cacheTtlDays * 86400, async () => {
    const response = await axios.get(`${base}/places/${id}`, {
      headers: {
        'X-Goog-Api-Key': config.googlePlacesApiKey,
        'X-Goog-FieldMask':
          'id,displayName,formattedAddress,rating,priceLevel,photos,types,location,nationalPhoneNumber,internationalPhoneNumber,websiteUri,regularOpeningHours,reviews,editorialSummary',
      },
    });

    return response.data;
  });
}

export async function photo(
  photoReference: string,
  maxWidth: number = 400,
  maxHeight: number = 400
): Promise<string> {
  const photoKey = `photo:${photoReference}:${maxWidth}:${maxHeight}`;

  return withCache(photoKey, config.cacheTtlDays * 86400, async () => {
    // photoReference is the full path like "places/{place_id}/photos/{photo_name}"
    // Google Places API (New) format: https://places.googleapis.com/v1/{name=places/*/photos/*}/media
    const photoUrl = `${base}/${photoReference}/media`;

    const response = await axios.get(photoUrl, {
      headers: {
        'X-Goog-Api-Key': config.googlePlacesApiKey,
      },
      params: {
        maxHeightPx: maxHeight,
        maxWidthPx: maxWidth,
        skipHttpRedirect: true,
      },
    });

    // The response should contain the photoUri
    return response.data.photoUri || response.request.res.responseUrl;
  });
}

export async function nearbyAdvanced(p: TextSearchParams) {
  return withCache(textSearchKey(p), config.cacheTtlDays * 86400, async () => {
    const requestBody: any = {
      textQuery: p.query,
      includedTypes: p.type ? [p.type] : undefined,
      maxResultCount: 20,
      languageCode: 'en',
    };

    // Add location restriction if lat/lng are provided
    if (p.lat !== undefined && p.lng !== undefined) {
      requestBody.locationRestriction = {
        circle: {
          center: {
            latitude: p.lat,
            longitude: p.lng,
          },
          radius: p.radius,
        },
      };
    }

    const response = await axios.post(
      `${base}/places:searchText`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': config.googlePlacesApiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.photos,places.types,places.location,places.regularOpeningHours.openNow',
        },
      }
    );

    return response.data;
  });
}
