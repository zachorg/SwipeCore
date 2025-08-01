import { Router, Request, Response } from 'express';
import { GooglePlacesService } from '../services/googlePlaces';
import { asyncHandler } from '../middleware/errorHandler';
import {
  nearbySearchSchema,
  placeIdSchema,
  photoReferenceSchema,
  NearbySearchParams,
} from '../types/places';

const router = Router();
const placesService = new GooglePlacesService();

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

  const places = await placesService.searchNearby(validatedParams);

  // Ensure places is always an array
  const placesArray = places || [];

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

  const place = await placesService.getPlaceDetails(placeId);

  res.json({
    success: true,
    data: place,
    timestamp: new Date().toISOString(),
  });
}));

// GET /api/places/photo/:photoReference - Get photo URL
router.get('/photo/:photoReference', asyncHandler(async (req: Request, res: Response) => {
  const params = {
    photoReference: req.query.photoReference,
    maxWidth: req.query.maxWidth ? parseInt(req.query.maxWidth as string) : undefined,
    maxHeight: req.query.maxHeight ? parseInt(req.query.maxHeight as string) : undefined,
  };

  // Remove undefined values
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== undefined && !Number.isNaN(value))
  );

  const validatedParams = photoReferenceSchema.parse(cleanParams);

  const photoUrl = await placesService.getPhotoUrl(
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

// GET /api/places/cache/stats - Get cache statistics (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/cache/stats', asyncHandler(async (req: Request, res: Response) => {
    const stats = placesService.getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  }));

  // POST /api/places/cache/clear - Clear cache (development only)
  router.post('/cache/clear', asyncHandler(async (req: Request, res: Response) => {
    placesService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  }));
}

export { router as placesRouter };