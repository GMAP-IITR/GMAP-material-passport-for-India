import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    console.log('⚡ Reusing existing MongoDB connection');
    return;
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      isConnected = true;
    });

    mongoose.connection.on('error', (err: Error) => {
      console.error('❌ MongoDB error:', err.message);
      isConnected = false;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ MongoDB connection failed: ${message}`);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('🔌 MongoDB disconnected gracefully');
}
