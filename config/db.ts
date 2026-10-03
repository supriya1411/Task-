import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let connectionType: 'mongodb' | 'memory' = 'memory';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[Database] Connecting to MongoDB at ${uri.replace(/:([^:@]+)@/, ':****@')}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      isConnected = true;
      connectionType = 'mongodb';
      console.log('[Database] MongoDB successfully connected via Mongoose.');
      return;
    } catch (err: any) {
      console.warn(`[Database] Could not connect to real MongoDB (${err.message}). Activating integrated memory fallback repository.`);
      isConnected = true;
      connectionType = 'memory';
    }
  } else {
    console.log('[Database] No MONGODB_URI provided in environment. Using integrated in-memory MongoDB-compatible repository.');
    isConnected = true;
    connectionType = 'memory';
  }
}

export function getDatabaseStatus() {
  return {
    connected: isConnected,
    type: connectionType,
    client: connectionType === 'mongodb' ? 'Mongoose v' + mongoose.version : 'Integrated Memory Database (MongoDB-compatible API)',
  };
}
