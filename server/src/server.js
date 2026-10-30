import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

connectDB()
  .then(() => app.listen(config.port, () => console.log(`ParkEase API listening on :${config.port} (${config.env})`)))
  .catch(() => process.exit(1));
