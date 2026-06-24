// Load env vars before any other import reads process.env
import { env } from './config/env';
import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`\n🚀  Server running  →  http://localhost:${env.PORT}`);
    console.log(`🌿  Environment     →  ${env.NODE_ENV}`);
    console.log(`📋  Health check    →  http://localhost:${env.PORT}/api/health\n`);
  });

  // ─── Graceful Shutdown ───────────────────────────────────────────────────────
  async function shutdown(signal: string): Promise<void> {
    console.log(`\n⚠️   ${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('👋  Server closed');
      process.exit(0);
    });

    // Force-exit if server hasn't closed within 10 s
    setTimeout(() => {
      console.error('⛔  Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('💥  Unhandled rejection:', reason);
    void shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err: Error) => {
    console.error('💥  Uncaught exception:', err.message);
    void shutdown('uncaughtException');
  });
}

bootstrap().catch((err: unknown) => {
  console.error('❌  Failed to start server:', err);
  process.exit(1);
});
