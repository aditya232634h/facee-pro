import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB connected (db: ${mongoose.connection.name})`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    throw err;
  }
}
