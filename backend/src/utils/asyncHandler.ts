import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wraps async route handlers so any thrown error or rejected promise is
 * forwarded to Express's error-handling middleware via next(err).
 *
 * Express 5 handles this natively, but the explicit wrapper keeps our
 * controllers clean and adds a consistent return type for the router.
 */
export function asyncHandler(fn: AsyncFn): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
