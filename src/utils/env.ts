import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

export const getEnvOrFail = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    try {
      // TODO: borrar esta parte si no se usa luego
      const filePath = path.join('/run/secrets/api-secrets', key);
      const data = fs.readFileSync(filePath, 'utf8');
      if (data.trim()) return data.trim();
    } catch (err) {
      //
    }
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};
