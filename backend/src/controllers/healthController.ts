import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const DB_STATE_MAP: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const getHealth = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const dbState = mongoose.connection.readyState;
  const mem = process.memoryUsage();

  ApiResponse.success(
    res,
    {
      server: 'running',
      database: DB_STATE_MAP[dbState] ?? 'unknown',
      environment: process.env['NODE_ENV'] ?? 'development',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
        rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      },
    },
    'Server is healthy',
  );
});
