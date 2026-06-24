import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const ENDPOINTS = [
  { method: 'GET',  path: '/',           description: 'Backend info and available endpoints' },
  { method: 'GET',  path: '/api/health', description: 'Server and database health status' },
  { method: 'POST', path: '/api/upload', description: 'Upload .xlsx, .xls, or .ifc file (multipart/form-data, field: "file")' },
];

export const getRoot = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  ApiResponse.success(
    res,
    {
      name: 'Material Passport API',
      version: '1.0.0',
      description: 'Backend API for the Material Passport open-source circular economy platform',
      environment: process.env['NODE_ENV'] ?? 'development',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      endpoints: ENDPOINTS,
    },
    'Material Passport API is running',
  );
});
