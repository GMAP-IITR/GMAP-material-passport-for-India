import dotenv from 'dotenv';
import path from 'path';

// Load .env from the backend root (two levels up from src/config/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE_MB: number;
  CORS_ORIGIN: string;
  // Optional at startup — validated lazily when LLM normalization is first called.
  ANTHROPIC_API_KEY: string;
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env: EnvConfig = {
  PORT: parseInt(optionalEnv('PORT', '5000'), 10),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  UPLOAD_DIR: optionalEnv('UPLOAD_DIR', 'uploads'),
  MAX_FILE_SIZE_MB: parseInt(optionalEnv('MAX_FILE_SIZE', '50'), 10),
  CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:3000'),
  ANTHROPIC_API_KEY: optionalEnv('ANTHROPIC_API_KEY', ''),
  get IS_PRODUCTION() {
    return this.NODE_ENV === 'production';
  },
  get IS_DEVELOPMENT() {
    return this.NODE_ENV === 'development';
  },
};
