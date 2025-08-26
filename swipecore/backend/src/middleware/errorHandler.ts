import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Invalid request data';
  }

  // Handle Google Places API errors
  if (error.message?.includes('INVALID_REQUEST')) {
    statusCode = 400;
    message = 'Invalid request parameters';
  } else if (error.message?.includes('OVER_QUERY_LIMIT')) {
    statusCode = 429;
    message = 'API quota exceeded, please try again later';
  } else if (error.message?.includes('REQUEST_DENIED')) {
    statusCode = 403;
    message = 'API request denied';
  } else if (error.message?.includes('UNKNOWN_ERROR')) {
    statusCode = 500;
    message = 'Service temporarily unavailable';
  }

  // Log error details (in production, use proper logging service)
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message,
    }),
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};