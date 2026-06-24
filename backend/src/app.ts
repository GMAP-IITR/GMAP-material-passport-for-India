import express, { type Application } from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { getRoot } from './controllers/rootController';

export function createApp(): Application {
  const app = express();

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  // ─── Body Parsers ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ─── Static Uploads ────────────────────────────────────────────────────────
  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

  // ─── Root Route ────────────────────────────────────────────────────────────
  app.get('/', getRoot);

  // ─── API Routes ────────────────────────────────────────────────────────────
  app.use('/api', routes);

  // ─── 404 → error pipeline ──────────────────────────────────────────────────
  app.use(notFound);

  // ─── Global Error Handler (must be last, must have 4 params) ──────────────
  app.use(errorHandler);

  return app;
}
