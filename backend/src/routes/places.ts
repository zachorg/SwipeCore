import { Router, Request, Response } from 'express';
import * as places from '../google';
import { asyncHandler } from '../middleware/errorHandler';
import { cache } from '../cache';
import { config } from '../config';
import {
  nearbySearchSchema,
  placeIdSchema,
  photoReferenceSchema,
  NearbySearchParams,
} from '../types/places';

const router = Router();

// GET /api/places/nearby - Search for nearby places
router.get('/nearby', asyncHandler(async (req: Request, res: Response) => {
  // Validate query parameters
  const queryParams = {
    lat: parseFloat(req.query.lat as string),
    lng: parseFloat(req.query.lng as string),
    radius: req.query.radius ? parseInt(req.query.radius as string) : undefined,
    keyword: req.query.keyword as string,
    type: req.query.type as string,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(queryParams).filter(([_, value]) => value !== undefined && !Number.isNaN(value))
  ) as NearbySearchParams;

  const validatedParams = nearbySearchSchema.parse(cleanParams);

  const response = await places.nearby(validatedParams);
  const placesArray = response?.places || [];

  res.json({
    success: true,
    data: placesArray,
    count: placesArray.length,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/places/:placeId - Get detailed information about a place
router.get('/:placeId', asyncHandler(async (req: Request, res: Response) => {
  const { placeId } = placeIdSchema.parse(req.params);

  const place = await places.details(placeId);

  res.json({
    success: true,
    data: place,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/places/photo/:photoReference - Get photo URL
router.get('/photo/:photoReference', asyncHandler(async (req: Request, res: Response) => {
  // The actual photo reference is in the query parameter, not the URL parameter
  const params = {
    photoReference: (req.query.photoReference as string) || req.params.photoReference,
    maxWidth: req.query.maxWidth ? parseInt(req.query.maxWidth as string) : undefined,
    maxHeight: req.query.maxHeight ? parseInt(req.query.maxHeight as string) : undefined,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && !Number.isNaN(value))
  );

  const validatedParams = photoReferenceSchema.parse(cleanParams);

  const photoUrl = await places.photo(
    validatedParams.photoReference,
    validatedParams.maxWidth,
    validatedParams.maxHeight
  );

  res.json({
    success: true,
    data: {
      photoUrl,
      photoReference: validatedParams.photoReference,
    },
    timestamp: new Date().toISOString(),
  });
}));

// Development only endpoints for dev cache management
if (config.nodeEnv === 'development') {
  router.delete('/dev-cache', asyncHandler(async (req: Request, res: Response) => {
    cache.clearDevCache();
    res.json({
      success: true,
      message: 'Dev cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  }));

  router.get('/dev-cache/stats', asyncHandler(async (req: Request, res: Response) => {
    const stats = cache.getDevCacheStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  }));
}

export { router as placesRouter };