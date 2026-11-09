import { config } from 'dotenv';

config();

export const PORT = process.env.PORT || 3000;
export const MONGODB_DB = process.env.MONGODB_DB || 'TFGDatabase';
export const JWT_SECRET = process.env.JWT_SECRET;
export const FRONT_URLS = (process.env.FRONT_URL || 'http://localhost:4200').split(',').map((u) => u.trim());
export const FRONT_URL = FRONT_URLS[0];
export const PRECIO_CAJON_PERSONALIZADO = 249.99;

if (!JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}
