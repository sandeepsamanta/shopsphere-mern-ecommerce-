import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

await connectDB();
console.log('MongoDB connected');

const server = createApp().listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
