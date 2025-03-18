/**
 * Utility for safely accessing environment variables
 */

interface EnvVariables {
  apiUrl: string;
  appEnv: 'development' | 'production' | 'test';
  enableAuth: boolean;
}

const env: EnvVariables = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  appEnv: (import.meta.env.VITE_APP_ENV as 'development' | 'production' | 'test') || 'development',
  enableAuth: import.meta.env.VITE_ENABLE_AUTH === 'true',
};

export const getEnv = (): EnvVariables => env;

export const isDevelopment = (): boolean => env.appEnv === 'development';
export const isProduction = (): boolean => env.appEnv === 'production';
export const isTest = (): boolean => env.appEnv === 'test'; 