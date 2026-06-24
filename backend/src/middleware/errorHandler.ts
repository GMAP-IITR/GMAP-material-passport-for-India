import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

interface MongooseValidationError {
  name: 'ValidationError';
  errors: Record<string, { message: string }>;
}

interface MongoDuplicateKeyError {
  code: number;
  keyValue: Record<string, unknown>;
}

function isValidationError(err: unknown): err is MongooseValidationError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as Error).name === 'ValidationError' &&
    'errors' in err
  );
}

function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as MongoDuplicateKeyError).code === 11000
  );
}

interface MulterError {
  name: 'MulterError';
  code: string;
  message: string;
}

function isMulterError(err: unknown): err is MulterError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as Error).name === 'MulterError' &&
    typeof (err as MulterError).code === 'string'
  );
}

// Must have 4 parameters so Express recognises this as an error handler
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (isMulterError(err)) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Check the server's upload size limit.`
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Unexpected file field. Use the field name "file".'
          : err.message;
  } else if (isValidationError(err)) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  } else if (isDuplicateKeyError(err)) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0] ?? 'field';
    message = `Duplicate value for ${field}`;
  } else if (err instanceof Error && err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err instanceof Error) {
    message = err.message;
  }

  const body: Record<string, unknown> = { success: false, message };

  if (env.IS_DEVELOPMENT && err instanceof Error) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}
