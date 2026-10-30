import dotenv from 'dotenv';
dotenv.config();

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  get mongoUri() { return required('MONGODB_URI'); },
  get jwtSecret() {
    const s = required('JWT_SECRET');
    if (s.length < 16) throw new Error('JWT_SECRET must be at least 16 characters');
    return s;
  },
};
